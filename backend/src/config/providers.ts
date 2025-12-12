/**
 * Provider configuration for ASR and LLM services
 */

export const ASR_CONFIG = {
  // Default provider
  defaultProvider: process.env.ASR_PROVIDER || 'openai-whisper',
  
  // Provider-specific config
  openai: {
    model: process.env.OPENAI_WHISPER_MODEL || 'whisper-1',
    language: 'en', // Auto-detect by default
    temperature: 0, // More deterministic
  },
  
  // Retry configuration
  retry: {
    maxAttempts: 3,
    backoffMs: 1000,
  },
};

export const LLM_CONFIG = {
  // Default provider
  defaultProvider: process.env.LLM_PROVIDER || 'openai-gpt',
  
  // Provider-specific config
  openai: {
    model: process.env.OPENAI_GPT_MODEL || 'gpt-4-1106-preview',
    temperature: 0.3, // Slightly creative but mostly factual
    maxTokens: 2000,
    topP: 0.9,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1,
  },
  
  // Prompt version for tracking
  promptVersion: '1.0.0',
  
  // Retry configuration
  retry: {
    maxAttempts: 3,
    backoffMs: 2000,
  },
  
  // Timeout
  timeoutMs: 30000, // 30 seconds
};

export const SAFETY_CONFIG = {
  // Keywords that trigger safety review
  dangerousKeywords: [
    'suicide',
    'kill myself',
    'end my life',
    'overdose',
    'self-harm',
  ],
  
  // Medical terms that require extra caution
  cautionKeywords: [
    'chest pain',
    'difficulty breathing',
    'severe bleeding',
    'unconscious',
    'stroke',
    'heart attack',
  ],
  
  // Auto-escalate if these are detected
  emergencyKeywords: [
    'cant breathe',
    'choking',
    'severe chest pain',
    'uncontrollable bleeding',
  ],
};

