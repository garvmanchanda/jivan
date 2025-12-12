/**
 * API request/response TypeScript type definitions
 * Shared between backend and mobile
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    request_id: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface SignedUrlResponse {
  upload_url: string;
  file_key: string;
  expires_at: string;
}

// Auth types
export interface LoginRequest {
  firebase_token: string;
}

export interface SignupRequest {
  email: string;
  phone?: string;
  firebase_token: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    phone: string | null;
    created_at: string;
  };
  token: string;
}

// Habit types
export enum HabitFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
}

export interface Habit {
  id: string;
  profile_id: string;
  title: string;
  description: string | null;
  frequency: HabitFrequency;
  start_date: string;
  active: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateHabitDTO {
  title: string;
  description?: string;
  frequency: HabitFrequency;
  start_date?: string;
  metadata?: Record<string, any>;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  profile_id: string;
  date: string;
  completed: boolean;
  note: string | null;
  created_at: string;
}

export interface CreateHabitLogDTO {
  date: string;
  completed: boolean;
  note?: string;
}

// Report types
export interface Report {
  id: string;
  profile_id: string;
  user_id: string;
  file_path: string;
  file_name: string;
  file_type: string;
  ocr_extracted_text: string | null;
  ocr_metadata: Record<string, any> | null;
  uploaded_at: string;
}

export interface CreateReportDTO {
  file_key: string;
  file_name: string;
  file_type: string;
}

