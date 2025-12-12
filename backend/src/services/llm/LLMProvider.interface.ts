/**
 * LLM Provider Interface
 * Defines the contract for all LLM (Large Language Model) providers
 */

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  [key: string]: any;
}

export interface LLMResult {
  text: string;
  finishReason: 'stop' | 'length' | 'content_filter' | 'other';
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: Record<string, any>;
}

export interface LLMProvider {
  /**
   * Provider name identifier
   */
  readonly name: string;

  /**
   * Generate completion from messages
   * @param messages Conversation messages
   * @param config Optional configuration
   * @returns LLM result
   */
  complete(messages: LLMMessage[], config?: LLMConfig): Promise<LLMResult>;

  /**
   * Generate structured JSON response
   * @param messages Conversation messages
   * @param schema JSON schema for response
   * @param config Optional configuration
   * @returns Parsed JSON object
   */
  completeJSON<T = any>(
    messages: LLMMessage[],
    schema?: any,
    config?: LLMConfig
  ): Promise<T>;

  /**
   * Check if provider is available/configured
   */
  isAvailable(): boolean;
}

