-- Undergraduate CBT System Safe Rollout & Policy Verification
-- Preserves all existing data, tables, users, and lecturers.

-- 1. Ensure cbt_exams table exists
CREATE TABLE IF NOT EXISTS public.cbt_exams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    course_code TEXT,
    topic TEXT,
    subject TEXT,
    portal TEXT,
    duration_minutes INTEGER DEFAULT 60,
    is_published BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Ensure cbt_questions table exists
CREATE TABLE IF NOT EXISTS public.cbt_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_id UUID REFERENCES public.cbt_exams(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option TEXT NOT NULL,
    explanation TEXT,
    marks INTEGER DEFAULT 1,
    topic TEXT,
    difficulty TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Ensure cbt_attempts table exists
CREATE TABLE IF NOT EXISTS public.cbt_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_id UUID REFERENCES public.cbt_exams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'in_progress',
    score INTEGER DEFAULT 0,
    total_correct INTEGER DEFAULT 0,
    total_wrong INTEGER DEFAULT 0,
    answers JSONB DEFAULT '{}'::jsonb,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.cbt_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_attempts ENABLE ROW LEVEL SECURITY;

-- Clean up old generic policies if present
DROP POLICY IF EXISTS "Public can view published exams" ON public.cbt_exams;
DROP POLICY IF EXISTS "Staff can manage exams" ON public.cbt_exams;
DROP POLICY IF EXISTS "Admin can manage all exams" ON public.cbt_exams;
DROP POLICY IF EXISTS "Lecturer can manage their own exams" ON public.cbt_exams;

DROP POLICY IF EXISTS "Staff can manage questions" ON public.cbt_questions;
DROP POLICY IF EXISTS "Admin can manage all questions" ON public.cbt_questions;
DROP POLICY IF EXISTS "Lecturer can manage their own exam questions" ON public.cbt_questions;
DROP POLICY IF EXISTS "Students can view questions for published exams" ON public.cbt_questions;

DROP POLICY IF EXISTS "Students can manage their own cbt attempts" ON public.cbt_attempts;
DROP POLICY IF EXISTS "Users can manage their own attempts" ON public.cbt_attempts;

-- Re-create robust RLS policies
CREATE POLICY "Public can view published exams" ON public.cbt_exams 
    FOR SELECT USING (is_published = true);

CREATE POLICY "Admin can manage all exams" ON public.cbt_exams 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'Admin')
    );

CREATE POLICY "Lecturer can manage their own exams" ON public.cbt_exams 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'Lecturer')
        AND created_by = auth.uid()
    );

CREATE POLICY "Students can view questions for published exams" ON public.cbt_questions 
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.cbt_exams WHERE cbt_exams.id = cbt_questions.exam_id AND cbt_exams.is_published = true)
        OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('Admin', 'Lecturer'))
    );

CREATE POLICY "Admin can manage all questions" ON public.cbt_questions 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'Admin')
    );

CREATE POLICY "Lecturer can manage their own exam questions" ON public.cbt_questions 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.cbt_exams WHERE cbt_exams.id = cbt_questions.exam_id AND cbt_exams.created_by = auth.uid())
    );

CREATE POLICY "Users can manage their own attempts" ON public.cbt_attempts 
    FOR ALL USING (
        user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('Admin', 'Lecturer'))
    );

-- Ensure Performance Indexes
CREATE INDEX IF NOT EXISTS idx_cbt_questions_exam_id ON public.cbt_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_cbt_attempts_exam_id ON public.cbt_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_cbt_attempts_user_id ON public.cbt_attempts(user_id);
