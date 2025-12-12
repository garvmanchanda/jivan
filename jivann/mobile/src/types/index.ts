// Database types matching Supabase schema

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  date_of_birth: string | null;
  timezone: string;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  owner_id: string;
  name: string;
  relationship: 'self' | 'spouse' | 'child' | 'parent' | 'other';
  date_of_birth: string | null;
  avatar_url: string | null;
  medical_conditions: string[];
  allergies: string[];
  medications: string[];
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ConversationStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Conversation {
  id: string;
  profile_id: string;
  owner_id: string;
  audio_url: string | null;
  transcript: string | null;
  llm_response: LLMResponse;
  status: ConversationStatus;
  processing_time_ms: number | null;
  model_version: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface LLMResponse {
  intent: string;
  summary: string;
  recommendations: Recommendation[];
  follow_up_questions: string[];
  urgency_level: 'low' | 'medium' | 'high' | 'emergency';
  suggested_actions: SuggestedAction[];
  confidence_score?: number;
  disclaimer?: string;
}

export interface Recommendation {
  type: 'general' | 'lifestyle' | 'medication' | 'appointment' | 'emergency' | 'monitoring' | 'prevention';
  title: string;
  description: string;
  priority: number;
}

export interface SuggestedAction {
  action_type: 
    | 'track_symptom'
    | 'schedule_appointment'
    | 'set_reminder'
    | 'log_medication'
    | 'start_habit'
    | 'call_provider'
    | 'call_emergency'
    | 'view_info'
    | 'dismiss';
  label: string;
  payload?: Record<string, unknown>;
}

export type HabitFrequency = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface Habit {
  id: string;
  profile_id: string;
  owner_id: string;
  name: string;
  description: string | null;
  frequency: HabitFrequency;
  custom_frequency_days: number[] | null;
  target_count: number;
  reminder_time: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  profile_id: string;
  logged_at: string;
  count: number;
  notes: string | null;
  created_at: string;
}

export type AppointmentType = 'checkup' | 'specialist' | 'lab' | 'pharmacy' | 'other';
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'missed';

export interface Appointment {
  id: string;
  profile_id: string;
  owner_id: string;
  type: AppointmentType;
  title: string;
  provider_name: string | null;
  location: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: AppointmentStatus;
  notes: string | null;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface Feedback {
  id: string;
  conversation_id: string | null;
  owner_id: string;
  rating: number;
  feedback_text: string | null;
  feedback_type: 'general' | 'accuracy' | 'helpfulness' | 'bug';
  created_at: string;
}

// API Response types
export interface ConversationResponse {
  success: boolean;
  conversation_id?: string;
  transcript?: string;
  llm_response?: LLMResponse;
  processing_time_ms?: number;
  error?: string;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Chat: { profileId?: string };
  Settings: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

