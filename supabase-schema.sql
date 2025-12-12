-- Jivan Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE 1: users
-- Stores user information with phone number as unique identifier
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast phone number lookups
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);

-- =====================================================
-- TABLE 2: profiles
-- Multiple profiles can exist under one user (Self, Mom, Dad, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age > 0 AND age <= 150),
  relation TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast user_id lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- =====================================================
-- TABLE 3: vitals
-- Stores both static vitals (weight, height) and daily tracking (sleep, water, steps)
-- =====================================================
CREATE TABLE IF NOT EXISTS vitals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'weight', 'height', 'age', 'sleep', 'water', 'steps', 'alcohol', 'cigarettes'
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL, -- 'kg', 'cm', 'hours', 'glasses', 'steps', 'drinks', 'count'
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_daily BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast profile_id and date-based queries
CREATE INDEX IF NOT EXISTS idx_vitals_profile_id ON vitals(profile_id);
CREATE INDEX IF NOT EXISTS idx_vitals_date ON vitals(date DESC);
CREATE INDEX IF NOT EXISTS idx_vitals_type ON vitals(type);

-- =====================================================
-- TABLE 4: conversations
-- Stores all health query conversations and AI responses
-- =====================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  summary TEXT NOT NULL,
  recommendations JSONB DEFAULT '[]'::jsonb, -- Array of recommendation strings
  red_flag TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast profile_id and timestamp queries
CREATE INDEX IF NOT EXISTS idx_conversations_profile_id ON conversations(profile_id);
CREATE INDEX IF NOT EXISTS idx_conversations_timestamp ON conversations(timestamp DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- For now, we'll keep it simple - full access via anon key
-- In production, you'd add proper authentication
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Create policies for anon access (for MVP - all users can access all data)
-- In production, you'd restrict this based on authenticated user

CREATE POLICY "Enable all access for anon users on users" 
ON users FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Enable all access for anon users on profiles" 
ON profiles FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Enable all access for anon users on vitals" 
ON vitals FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Enable all access for anon users on conversations" 
ON conversations FOR ALL 
USING (true) 
WITH CHECK (true);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- Auto-update updated_at timestamp
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER update_users_updated_at 
BEFORE UPDATE ON users 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for profiles table
CREATE TRIGGER update_profiles_updated_at 
BEFORE UPDATE ON profiles 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SUCCESS!
-- =====================================================
-- All tables, indexes, and policies have been created
-- Your database is ready to use!

