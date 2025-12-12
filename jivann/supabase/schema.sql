-- AI Healthcare Concierge - Database Schema
-- Supabase Postgres Database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS & PROFILES
-- ============================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    date_of_birth DATE,
    timezone TEXT DEFAULT 'UTC',
    language TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Family members / dependents managed by the user
CREATE TABLE family_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    relationship TEXT NOT NULL, -- 'self', 'spouse', 'child', 'parent', 'other'
    date_of_birth DATE,
    avatar_url TEXT,
    medical_conditions JSONB DEFAULT '[]',
    allergies JSONB DEFAULT '[]',
    medications JSONB DEFAULT '[]',
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONVERSATIONS & AI INTERACTIONS
-- ============================================

CREATE TYPE conversation_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    audio_url TEXT,
    transcript TEXT,
    llm_response JSONB NOT NULL,
    status conversation_status DEFAULT 'pending',
    processing_time_ms INTEGER,
    model_version TEXT DEFAULT 'gpt-4',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- HEALTH TRACKING
-- ============================================

CREATE TYPE habit_frequency AS ENUM ('daily', 'weekly', 'monthly', 'custom');

CREATE TABLE habits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    frequency habit_frequency DEFAULT 'daily',
    custom_frequency_days INTEGER[], -- For custom frequency
    target_count INTEGER DEFAULT 1,
    reminder_time TIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE habit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    count INTEGER DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- APPOINTMENTS & REMINDERS
-- ============================================

CREATE TYPE appointment_type AS ENUM ('checkup', 'specialist', 'lab', 'pharmacy', 'other');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'completed', 'cancelled', 'missed');

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type appointment_type DEFAULT 'checkup',
    title TEXT NOT NULL,
    provider_name TEXT,
    location TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    status appointment_status DEFAULT 'scheduled',
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FEEDBACK & RATINGS
-- ============================================

CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    feedback_type TEXT DEFAULT 'general', -- 'general', 'accuracy', 'helpfulness', 'bug'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_family_members_owner ON family_members(owner_id);
CREATE INDEX idx_conversations_profile ON conversations(profile_id);
CREATE INDEX idx_conversations_owner ON conversations(owner_id);
CREATE INDEX idx_conversations_created ON conversations(created_at DESC);
CREATE INDEX idx_habits_profile ON habits(profile_id);
CREATE INDEX idx_habit_logs_habit ON habit_logs(habit_id);
CREATE INDEX idx_habit_logs_date ON habit_logs(logged_at DESC);
CREATE INDEX idx_appointments_profile ON appointments(profile_id);
CREATE INDEX idx_appointments_scheduled ON appointments(scheduled_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only access their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Family members: Users can only access their own family members
CREATE POLICY "Users can view own family members" ON family_members
    FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own family members" ON family_members
    FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own family members" ON family_members
    FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own family members" ON family_members
    FOR DELETE USING (auth.uid() = owner_id);

-- Conversations: Users can only access their own conversations
CREATE POLICY "Users can view own conversations" ON conversations
    FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own conversations" ON conversations
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Habits: Users can only access their own habits
CREATE POLICY "Users can view own habits" ON habits
    FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own habits" ON habits
    FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own habits" ON habits
    FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own habits" ON habits
    FOR DELETE USING (auth.uid() = owner_id);

-- Habit logs: Users can only access logs for their habits
CREATE POLICY "Users can view own habit logs" ON habit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM habits h 
            WHERE h.id = habit_logs.habit_id 
            AND h.owner_id = auth.uid()
        )
    );
CREATE POLICY "Users can insert own habit logs" ON habit_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM habits h 
            WHERE h.id = habit_logs.habit_id 
            AND h.owner_id = auth.uid()
        )
    );

-- Appointments: Users can only access their own appointments
CREATE POLICY "Users can view own appointments" ON appointments
    FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own appointments" ON appointments
    FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own appointments" ON appointments
    FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own appointments" ON appointments
    FOR DELETE USING (auth.uid() = owner_id);

-- Feedback: Users can only access their own feedback
CREATE POLICY "Users can view own feedback" ON feedback
    FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own feedback" ON feedback
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('audio-recordings', 'audio-recordings', false);

-- Storage policies
CREATE POLICY "Users can upload audio" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'audio-recordings' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view own audio" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'audio-recordings' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_family_members_updated_at
    BEFORE UPDATE ON family_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_habits_updated_at
    BEFORE UPDATE ON habits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    
    -- Create a default "self" family member
    INSERT INTO family_members (owner_id, name, relationship)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Me'),
        'self'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

