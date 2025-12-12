-- Create admin_flags table for flagging problematic content
CREATE TABLE IF NOT EXISTS admin_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  flag_reason VARCHAR(255) NOT NULL,
  flag_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_admin_flags_conversation_id ON admin_flags(conversation_id);
CREATE INDEX idx_admin_flags_status ON admin_flags(status);
CREATE INDEX idx_admin_flags_flag_type ON admin_flags(flag_type);
CREATE INDEX idx_admin_flags_created_by ON admin_flags(created_by);
CREATE INDEX idx_admin_flags_created_at ON admin_flags(created_at DESC);

-- Add constraint for status enum
ALTER TABLE admin_flags ADD CONSTRAINT check_flag_status 
  CHECK (status IN ('open', 'triaged', 'closed'));

-- Add constraint for flag_type enum
ALTER TABLE admin_flags ADD CONSTRAINT check_flag_type 
  CHECK (flag_type IN ('harmful_content', 'incorrect_advice', 'safety_concern', 'user_report', 'other'));

-- Create trigger to update updated_at
CREATE TRIGGER update_admin_flags_updated_at BEFORE UPDATE ON admin_flags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

