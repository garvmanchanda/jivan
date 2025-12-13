-- Jivan Database Schema V2 - Intelligent Memory System
-- Run this SQL in your Supabase SQL Editor
-- This adds memory tracking capabilities for continuous health journeys

-- =====================================================
-- TABLE 1: active_issues
-- Tracks ongoing health concerns per profile
-- =====================================================
CREATE TABLE IF NOT EXISTS active_issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'improving', 'resolved', 'monitoring')),
  severity TEXT NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe')),
  first_reported_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_mentioned_at TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast profile_id and status lookups
CREATE INDEX IF NOT EXISTS idx_active_issues_profile_status ON active_issues(profile_id, status);
CREATE INDEX IF NOT EXISTS idx_active_issues_last_mentioned ON active_issues(last_mentioned_at DESC);

-- =====================================================
-- TABLE 2: event_memory
-- Stores single health events (conversations, vitals, reports)
-- =====================================================
CREATE TABLE IF NOT EXISTS event_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'conversation', 'vitals', 'report_finding', 'device_vital'
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast profile_id and timestamp queries
CREATE INDEX IF NOT EXISTS idx_event_memory_profile_time ON event_memory(profile_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_event_memory_type ON event_memory(event_type);

-- =====================================================
-- TABLE 3: insight_memory
-- Stores learned patterns and correlations
-- =====================================================
CREATE TABLE IF NOT EXISTS insight_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  insight TEXT NOT NULL,
  confidence NUMERIC CHECK (confidence >= 0 AND confidence <= 1),
  related_issue_id UUID REFERENCES active_issues(id) ON DELETE SET NULL,
  supporting_event_ids UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast profile_id lookups
CREATE INDEX IF NOT EXISTS idx_insight_memory_profile ON insight_memory(profile_id);
CREATE INDEX IF NOT EXISTS idx_insight_memory_confidence ON insight_memory(confidence DESC);

-- =====================================================
-- TABLE 4: issue_history
-- Tracks status changes for active issues
-- =====================================================
CREATE TABLE IF NOT EXISTS issue_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES active_issues(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  old_severity TEXT,
  new_severity TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT
);

-- Index for fast issue_id lookups
CREATE INDEX IF NOT EXISTS idx_issue_history_issue ON issue_history(issue_id, changed_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- For now, we'll keep it simple - full access via anon key
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE active_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE insight_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_history ENABLE ROW LEVEL SECURITY;

-- Create policies for anon access (for MVP)
CREATE POLICY "Enable all access for anon users on active_issues" 
ON active_issues FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Enable all access for anon users on event_memory" 
ON event_memory FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Enable all access for anon users on insight_memory" 
ON insight_memory FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Enable all access for anon users on issue_history" 
ON issue_history FOR ALL 
USING (true) 
WITH CHECK (true);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- Auto-update updated_at timestamp
-- =====================================================

-- Trigger for active_issues table
CREATE TRIGGER update_active_issues_updated_at 
BEFORE UPDATE ON active_issues 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for insight_memory table
CREATE TRIGGER update_insight_memory_updated_at 
BEFORE UPDATE ON insight_memory 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRIGGER: Log issue status changes to history
-- =====================================================
CREATE OR REPLACE FUNCTION log_issue_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.status != NEW.status OR OLD.severity != NEW.severity) THEN
    INSERT INTO issue_history (issue_id, old_status, new_status, old_severity, new_severity, reason)
    VALUES (NEW.id, OLD.status, NEW.status, OLD.severity, NEW.severity, 'System update');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_issue_status_changes
AFTER UPDATE ON active_issues
FOR EACH ROW
EXECUTE FUNCTION log_issue_status_change();

-- =====================================================
-- SUCCESS!
-- =====================================================
-- Memory system tables created:
-- - active_issues: Tracks ongoing health concerns
-- - event_memory: Stores all health events
-- - insight_memory: Learned patterns and correlations
-- - issue_history: Audit log for issue changes
-- Your intelligent memory system is ready!

