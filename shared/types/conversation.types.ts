/**
 * Conversation-related TypeScript type definitions
 * Shared between backend and mobile
 */

export enum InputType {
  VOICE = 'voice',
  TEXT = 'text',
}

export enum ConversationStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface StructuredResponse {
  summary: string;
  causes: string[];
  self_care: string[];
  red_flags: string[];
  recommendations: string[];
  follow_up: string[];
}

export interface Conversation {
  id: string;
  profile_id: string;
  user_id: string;
  input_type: InputType;
  transcript: string;
  asr_provider: string | null;
  llm_model: string | null;
  llm_prompt_version: string | null;
  structured_response: StructuredResponse | null;
  status: ConversationStatus;
  feedback: {
    rating?: number;
    reason?: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface CreateConversationDTO {
  profile_id: string;
  input_type: InputType;
  transcript?: string;
  audio_s3_key?: string;
  metadata?: Record<string, any>;
}

export interface UpdateConversationFeedbackDTO {
  rating: number;
  reason?: string;
}

