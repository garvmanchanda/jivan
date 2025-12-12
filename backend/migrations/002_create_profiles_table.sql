-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  relation VARCHAR(50) NOT NULL,
  dob DATE,
  sex VARCHAR(20) NOT NULL DEFAULT 'unknown',
  notes TEXT,
  avatar_url VARCHAR(500),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_created_at ON profiles(created_at);
CREATE INDEX idx_profiles_deleted_at ON profiles(deleted_at);

-- Add constraint for sex enum
ALTER TABLE profiles ADD CONSTRAINT check_sex 
  CHECK (sex IN ('male', 'female', 'other', 'unknown'));

-- Add constraint for relation enum
ALTER TABLE profiles ADD CONSTRAINT check_relation 
  CHECK (relation IN ('self', 'spouse', 'child', 'parent', 'sibling', 'other'));

-- Create trigger to update updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

