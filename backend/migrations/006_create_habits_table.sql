-- Create habits table
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  frequency VARCHAR(20) NOT NULL DEFAULT 'daily',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_habits_profile_id ON habits(profile_id);
CREATE INDEX idx_habits_active ON habits(active);
CREATE INDEX idx_habits_start_date ON habits(start_date);
CREATE INDEX idx_habits_profile_active ON habits(profile_id, active);

-- Add constraint for frequency enum
ALTER TABLE habits ADD CONSTRAINT check_habit_frequency 
  CHECK (frequency IN ('daily', 'weekly'));

-- Create trigger to update updated_at
CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON habits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

