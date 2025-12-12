import {
  LLMProvider,
  LLMConfig,
  LLMResult,
  LLMMessage,
} from './LLMProvider.interface';
import OpenAI from 'openai';
import { logger } from '../../utils/logger';
import { LLM_CONFIG } from '../../config/providers';

/**
 * OpenAI GPT Provider Implementation
 */
export class OpenAIGPTProvider implements LLMProvider {
  readonly name = 'openai-gpt';
  private client: OpenAI;
  private defaultConfig: LLMConfig;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    this.client = new OpenAI({
      apiKey,
      organization: process.env.OPENAI_ORG_ID || undefined,
      timeout: LLM_CONFIG.timeoutMs,
    });

    this.defaultConfig = {
      model: LLM_CONFIG.openai.model,
      temperature: LLM_CONFIG.openai.temperature,
      maxTokens: LLM_CONFIG.openai.maxTokens,
      topP: LLM_CONFIG.openai.topP,
      frequencyPenalty: LLM_CONFIG.openai.frequencyPenalty,
      presencePenalty: LLM_CONFIG.openai.presencePenalty,
    };

    logger.info('OpenAI GPT Provider initialized');
  }

  /**
   * Check if provider is available
   */
  isAvailable(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }

  /**
   * Generate completion
   */
  async complete(
    messages: LLMMessage[],
    config?: LLMConfig
  ): Promise<LLMResult> {
    const startTime = Date.now();

    try {
      const mergedConfig = { ...this.defaultConfig, ...config };

      logger.debug('Starting LLM completion', {
        messageCount: messages.length,
        model: mergedConfig.model,
      });

      const completion = await this.client.chat.completions.create({
        model: mergedConfig.model as string,
        messages: messages as any[],
        temperature: mergedConfig.temperature,
        max_tokens: mergedConfig.maxTokens,
        top_p: mergedConfig.topP,
        frequency_penalty: mergedConfig.frequencyPenalty,
        presence_penalty: mergedConfig.presencePenalty,
      });

      const duration = Date.now() - startTime;

      const choice = completion.choices[0];
      const text = choice.message.content || '';

      logger.info('LLM completion successful', {
        duration,
        model: completion.model,
        finishReason: choice.finish_reason,
        tokensUsed: completion.usage?.total_tokens,
      });

      return {
        text,
        finishReason: (choice.finish_reason as any) || 'other',
        usage: completion.usage
          ? {
              promptTokens: completion.usage.prompt_tokens,
              completionTokens: completion.usage.completion_tokens,
              totalTokens: completion.usage.total_tokens,
            }
          : undefined,
        metadata: {
          provider: this.name,
          model: completion.model,
          duration,
        },
      };
    } catch (error: any) {
      logger.error('LLM completion failed', {
        error: error.message,
        duration: Date.now() - startTime,
      });

      throw new Error(`LLM completion failed: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Generate structured JSON response
   */
  async completeJSON<T = any>(
    messages: LLMMessage[],
    schema?: any,
    config?: LLMConfig
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const mergedConfig = { ...this.defaultConfig, ...config };

      logger.debug('Starting LLM JSON completion', {
        messageCount: messages.length,
        hasSchema: !!schema,
      });

      // Use JSON mode for GPT-4
      const completion = await this.client.chat.completions.create({
        model: mergedConfig.model as string,
        messages: messages as any[],
        temperature: mergedConfig.temperature,
        max_tokens: mergedConfig.maxTokens,
        top_p: mergedConfig.topP,
        frequency_penalty: mergedConfig.frequencyPenalty,
        presence_penalty: mergedConfig.presencePenalty,
        response_format: { type: 'json_object' },
      });

      const duration = Date.now() - startTime;

      const choice = completion.choices[0];
      const text = choice.message.content || '{}';

      logger.info('LLM JSON completion successful', {
        duration,
        model: completion.model,
        tokensUsed: completion.usage?.total_tokens,
      });

      // Parse JSON response
      try {
        const parsed = JSON.parse(text);
        return parsed as T;
      } catch (parseError) {
        logger.error('Failed to parse JSON response', {
          error: parseError,
          responseText: text.substring(0, 200),
        });
        throw new Error('Failed to parse JSON response');
      }
    } catch (error: any) {
      logger.error('LLM JSON completion failed', {
        error: error.message,
        duration: Date.now() - startTime,
      });

      throw new Error(
        `LLM JSON completion failed: ${error.message || 'Unknown error'}`
      );
    }
  }

  /**
   * Retry logic wrapper
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = LLM_CONFIG.retry.maxAttempts
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;

        // Don't retry on certain errors
        if (
          error.message?.includes('content_filter') ||
          error.message?.includes('invalid_request')
        ) {
          throw error;
        }

        if (attempt < maxAttempts) {
          const backoffMs =
            LLM_CONFIG.retry.backoffMs * Math.pow(2, attempt - 1);
          logger.warn('LLM attempt failed, retrying', {
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
   * Complete with retry logic
   */
  async completeWithRetry(
    messages: LLMMessage[],
    config?: LLMConfig
  ): Promise<LLMResult> {
    return this.withRetry(() => this.complete(messages, config));
  }

  /**
   * Complete JSON with retry logic
   */
  async completeJSONWithRetry<T = any>(
    messages: LLMMessage[],
    schema?: any,
    config?: LLMConfig
  ): Promise<T> {
    return this.withRetry(() => this.completeJSON<T>(messages, schema, config));
  }
}

