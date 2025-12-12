/**
 * ASR Provider Interface
 * Defines the contract for all ASR (Automatic Speech Recognition) providers
 */

export interface ASRConfig {
  language?: string;
  model?: string;
  temperature?: number;
  [key: string]: any;
}

export interface ASRResult {
  transcript: string;
  confidence?: number;
  language?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface ASRProvider {
  /**
   * Provider name identifier
   */
  readonly name: string;

  /**
   * Transcribe audio buffer to text
   * @param audioBuffer Audio file buffer
   * @param config Optional configuration
   * @returns Transcription result
   */
  transcribe(audioBuffer: Buffer, config?: ASRConfig): Promise<ASRResult>;

  /**
   * Transcribe audio from file path
   * @param filePath Path to audio file
   * @param config Optional configuration
   * @returns Transcription result
   */
  transcribeFile(filePath: string, config?: ASRConfig): Promise<ASRResult>;

  /**
   * Check if provider is available/configured
   */
  isAvailable(): boolean;

  /**
   * Get supported audio formats
   */
  getSupportedFormats(): string[];
}

