-- Add keywords and speaking time columns to session_answers
ALTER TABLE session_answers
  ADD COLUMN IF NOT EXISTS keywords_used JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS keywords_missed JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS speaking_time_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS ideal_speaking_time TEXT;

-- Add model_answer and keywords columns to question_analyses within session_reports
-- (stored as JSONB so no schema change needed — the new fields are inside the JSON)
-- No separate migration needed for JSONB fields inside question_analyses array
