-- Add extended report fields to session_reports
ALTER TABLE session_reports
  ADD COLUMN IF NOT EXISTS question_analyses JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS top_5_improvement_areas JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS hiring_recommendation TEXT,
  ADD COLUMN IF NOT EXISTS estimated_interview_level TEXT,
  ADD COLUMN IF NOT EXISTS suggested_practice_plan JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS final_interviewer_remarks TEXT,
  ADD COLUMN IF NOT EXISTS grammar_analysis TEXT,
  ADD COLUMN IF NOT EXISTS vocabulary_analysis TEXT,
  ADD COLUMN IF NOT EXISTS problem_solving_analysis TEXT,
  ADD COLUMN IF NOT EXISTS professionalism_analysis TEXT;

-- Add feedback_detail and example_answer to session_answers
ALTER TABLE session_answers
  ADD COLUMN IF NOT EXISTS ai_feedback_detail JSONB,
  ADD COLUMN IF NOT EXISTS example_answer TEXT;
