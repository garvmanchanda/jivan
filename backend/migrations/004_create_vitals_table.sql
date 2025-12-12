-- Create vitals table
CREATE TABLE IF NOT EXISTS vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  value JSONB NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  source VARCHAR(20) NOT NULL DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_vitals_profile_id ON vitals(profile_id);
CREATE INDEX idx_vitals_type ON vitals(type);
CREATE INDEX idx_vitals_recorded_at ON vitals(recorded_at DESC);
CREATE INDEX idx_vitals_profile_type ON vitals(profile_id, type);

-- Add constraint for type enum
ALTER TABLE vitals ADD CONSTRAINT check_vital_type 
  CHECK (type IN ('bp', 'hr', 'temp', 'weight', 'glucose', 'spo2'));

-- Add constraint for source enum
ALTER TABLE vitals ADD CONSTRAINT check_vital_source 
  CHECK (source IN ('manual', 'device'));

