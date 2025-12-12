-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_path VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size BIGINT,
  ocr_extracted_text TEXT,
  ocr_metadata JSONB,
  ocr_status VARCHAR(20) DEFAULT 'pending',
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_reports_profile_id ON reports(profile_id);
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_uploaded_at ON reports(uploaded_at DESC);
CREATE INDEX idx_reports_ocr_status ON reports(ocr_status);

-- Create full-text search index for OCR text
CREATE INDEX idx_reports_ocr_text_search ON reports 
  USING gin(to_tsvector('english', ocr_extracted_text));

-- Add constraint for OCR status enum
ALTER TABLE reports ADD CONSTRAINT check_ocr_status 
  CHECK (ocr_status IN ('pending', 'processing', 'completed', 'failed'));

