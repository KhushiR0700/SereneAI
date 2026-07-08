-- Add topic column to interview_sessions
ALTER TABLE interview_sessions ADD COLUMN IF NOT EXISTS topic text;

-- Add question_topic column to session_answers
ALTER TABLE session_answers ADD COLUMN IF NOT EXISTS question_topic text;
