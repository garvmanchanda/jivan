-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  input_type VARCHAR(20) NOT NULL,
  transcript TEXT,
  audio_s3_key VARCHAR(500),
  asr_provider VARCHAR(50),
  llm_model VARCHAR(100),
  llm_prompt_version VARCHAR(50),
  structured_response JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'queued',
  feedback JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_conversations_profile_id ON conversations(profile_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX idx_conversations_input_type ON conversations(input_type);

-- Add constraint for input_type enum
ALTER TABLE conversations ADD CONSTRAINT check_input_type 
  CHECK (input_type IN ('voice', 'text'));

-- Add constraint for status enum
ALTER TABLE conversations ADD CONSTRAINT check_status 
  CHECK (status IN ('queued', 'processing', 'completed', 'failed'));

-- Create trigger to update updated_at
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

