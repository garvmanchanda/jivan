import { ASRProvider, ASRConfig, ASRResult } from './ASRProvider.interface';
import OpenAI from 'openai';
import FormData from 'form-data';
import { logger } from '../../utils/logger';
import { ASR_CONFIG } from '../../config/providers';
import fs from 'fs';
import { Readable } from 'stream';

/**
 * OpenAI Whisper ASR Provider Implementation
 */
export class OpenAIWhisperProvider implements ASRProvider {
  readonly name = 'openai-whisper';
  private client: OpenAI;
  private defaultConfig: ASRConfig;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    this.client = new OpenAI({
      apiKey,
      organization: process.env.OPENAI_ORG_ID || undefined,
    });

    this.defaultConfig = {
      model: ASR_CONFIG.openai.model,
      language: ASR_CONFIG.openai.language,
      temperature: ASR_CONFIG.openai.temperature,
    };

    logger.info('OpenAI Whisper Provider initialized');
  }

  /**
   * Check if provider is available
   */
  isAvailable(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }

  /**
   * Get supported audio formats
   */
  getSupportedFormats(): string[] {
    return [
      'mp3',
      'mp4',
      'mpeg',
      'mpga',
      'm4a',
      'wav',
      'webm',
      'flac',
      'ogg',
    ];
  }

  /**
   * Transcribe audio buffer
   */
  async transcribe(
    audioBuffer: Buffer,
    config?: ASRConfig
  ): Promise<ASRResult> {
    const startTime = Date.now();

    try {
      const mergedConfig = { ...this.defaultConfig, ...config };

      logger.debug('Starting Whisper transcription', {
        bufferSize: audioBuffer.length,
        config: mergedConfig,
      });

      // Create a readable stream from buffer
      const stream = Readable.from(audioBuffer);

      // OpenAI expects a file, so we create a FormData with the buffer
      const transcription = await this.client.audio.transcriptions.create({
        file: stream as any,
        model: mergedConfig.model as string,
        language: mergedConfig.language,
        temperature: mergedConfig.temperature,
        response_format: 'verbose_json', // Get detailed response
      });

      const duration = Date.now() - startTime;

      logger.info('Transcription completed', {
        duration,
        textLength: transcription.text.length,
        language: transcription.language,
      });

      return {
        transcript: transcription.text,
        language: transcription.language,
        duration,
        metadata: {
          provider: this.name,
          model: mergedConfig.model,
          segments: (transcription as any).segments || [],
        },
      };
    } catch (error: any) {
      logger.error('Whisper transcription failed', {
        error: error.message,
        duration: Date.now() - startTime,
      });

      throw new Error(
        `Transcription failed: ${error.message || 'Unknown error'}`
      );
    }
  }

  /**
   * Transcribe from file path
   */
  async transcribeFile(
    filePath: string,
    config?: ASRConfig
  ): Promise<ASRResult> {
    const startTime = Date.now();

    try {
      const mergedConfig = { ...this.defaultConfig, ...config };

      logger.debug('Starting Whisper transcription from file', {
        filePath,
        config: mergedConfig,
      });

      // Create read stream from file
      const fileStream = fs.createReadStream(filePath);

      const transcription = await this.client.audio.transcriptions.create({
        file: fileStream as any,
        model: mergedConfig.model as string,
        language: mergedConfig.language,
        temperature: mergedConfig.temperature,
        response_format: 'verbose_json',
      });

      const duration = Date.now() - startTime;

      logger.info('File transcription completed', {
        filePath,
        duration,
        textLength: transcription.text.length,
      });

      return {
        transcript: transcription.text,
        language: transcription.language,
        duration,
        metadata: {
          provider: this.name,
          model: mergedConfig.model,
          filePath,
        },
      };
    } catch (error: any) {
      logger.error('File transcription failed', {
        error: error.message,
        filePath,
        duration: Date.now() - startTime,
      });

      throw new Error(
        `File transcription failed: ${error.message || 'Unknown error'}`
      );
    }
  }

  /**
   * Retry logic wrapper
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = ASR_CONFIG.retry.maxAttempts
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;

        if (attempt < maxAttempts) {
          const backoffMs =
            ASR_CONFIG.retry.backoffMs * Math.pow(2, attempt - 1);
          logger.warn('ASR attempt failed, retrying', {
            attempt,
            maxAttempts,
            backoffMs,
            error: error.message,
          });

          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }
      }
    }

    throw lastError!;
  }

  /**
   * Transcribe with retry logic
   */
  async transcribeWithRetry(
    audioBuffer: Buffer,
    config?: ASRConfig
  ): Promise<ASRResult> {
    return this.withRetry(() => this.transcribe(audioBuffer, config));
  }
}

