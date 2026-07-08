
-- SereneAI schema

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  target_role TEXT DEFAULT 'Software Engineer',
  university TEXT DEFAULT '',
  graduation_year INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Interview sessions
CREATE TABLE interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'Medium',
  interview_type TEXT NOT NULL DEFAULT 'Technical',
  status TEXT NOT NULL DEFAULT 'in_progress',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  overall_score NUMERIC,
  communication_score NUMERIC,
  confidence_score NUMERIC,
  technical_score NUMERIC,
  pronunciation_score NUMERIC,
  clarity_score NUMERIC,
  problem_solving_score NUMERIC,
  readiness_level TEXT,
  question_count INT NOT NULL DEFAULT 0,
  duration_seconds INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Individual answers within a session
CREATE TABLE session_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_domain TEXT,
  question_difficulty TEXT,
  question_type TEXT,
  answer_text TEXT,
  answer_mode TEXT DEFAULT 'text',
  follow_up_question TEXT,
  model_answer TEXT,
  communication_score NUMERIC,
  confidence_score NUMERIC,
  technical_score NUMERIC,
  pronunciation_score NUMERIC,
  clarity_score NUMERIC,
  problem_solving_score NUMERIC,
  overall_score NUMERIC,
  ai_feedback TEXT,
  voice_analysis JSONB,
  timeline_annotations JSONB DEFAULT '[]'::jsonb,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_seconds INT
);

-- Session reports
CREATE TABLE session_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  overall_summary TEXT,
  strengths JSONB DEFAULT '[]'::jsonb,
  weaknesses JSONB DEFAULT '[]'::jsonb,
  communication_analysis TEXT,
  technical_analysis TEXT,
  confidence_analysis TEXT,
  pronunciation_analysis TEXT,
  areas_for_improvement JSONB DEFAULT '[]'::jsonb,
  action_plan JSONB DEFAULT '[]'::jsonb,
  readiness_level TEXT,
  recruiter_impression_score NUMERIC,
  next_three_fixes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pronunciation practice sessions
CREATE TABLE pronunciation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  ipa_notation TEXT,
  difficulty TEXT DEFAULT 'Medium',
  clarity_score NUMERIC,
  word_accuracy NUMERIC,
  problem_words JSONB DEFAULT '[]'::jsonb,
  mispronounced_words JSONB DEFAULT '[]'::jsonb,
  ai_feedback TEXT,
  improvement_suggestions JSONB DEFAULT '[]'::jsonb,
  attempt_audio_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Saved questions from library
CREATE TABLE saved_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  domain TEXT,
  difficulty TEXT,
  question_type TEXT,
  company TEXT,
  is_favorite BOOLEAN DEFAULT false,
  practice_later BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE pronunciation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_questions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "select_own_profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- Interview sessions policies
CREATE POLICY "select_own_sessions" ON interview_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_sessions" ON interview_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_sessions" ON interview_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_sessions" ON interview_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Session answers policies
CREATE POLICY "select_own_answers" ON session_answers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_answers" ON session_answers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_answers" ON session_answers FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_answers" ON session_answers FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Session reports policies
CREATE POLICY "select_own_reports" ON session_reports FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_reports" ON session_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_reports" ON session_reports FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_reports" ON session_reports FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Pronunciation sessions policies
CREATE POLICY "select_own_pronunciation" ON pronunciation_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_pronunciation" ON pronunciation_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_pronunciation" ON pronunciation_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_pronunciation" ON pronunciation_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Saved questions policies
CREATE POLICY "select_own_saved_questions" ON saved_questions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_saved_questions" ON saved_questions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_saved_questions" ON saved_questions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_saved_questions" ON saved_questions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX idx_sessions_created ON interview_sessions(created_at DESC);
CREATE INDEX idx_answers_session_id ON session_answers(session_id);
CREATE INDEX idx_answers_user_id ON session_answers(user_id);
CREATE INDEX idx_reports_session_id ON session_reports(session_id);
CREATE INDEX idx_reports_user_id ON session_reports(user_id);
CREATE INDEX idx_pronunciation_user_id ON pronunciation_sessions(user_id);
CREATE INDEX idx_pronunciation_created ON pronunciation_sessions(created_at DESC);
CREATE INDEX idx_saved_questions_user_id ON saved_questions(user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
