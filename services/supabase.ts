import { createClient } from '@supabase/supabase-js';

// Supabase configuration from environment variables
// Set these in your .env file (see .env.example)
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false, // We're using phone numbers, not auth sessions
  },
});

// Database Types
export interface User {
  id: string;
  phone_number: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  age: number;
  relation: string;
  created_at: string;
  updated_at: string;
}

export interface Vital {
  id: string;
  profile_id: string;
  type: string;
  value: number;
  unit: string;
  date: string;
  is_daily: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  profile_id: string;
  query: string;
  summary: string;
  recommendations: string[];
  red_flag: string | null;
  timestamp: string;
  created_at: string;
}

