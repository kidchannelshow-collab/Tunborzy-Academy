-- ============================================================================
-- UTME CBT SECURITY & RLS AUDIT MIGRATION (0033)
-- 100% Idempotent. Preserves all existing tables, columns, and data.
-- 
-- SECURITY GUARANTEES:
-- 1. Students are strictly denied direct SELECT access to utme_questions (FOR SELECT USING (false)).
--    All questions are served exclusively via the secure Express backend proxy endpoints (/api/utme/start).
-- 2. Students are strictly denied direct INSERT, UPDATE, or DELETE access to utme_attempts.
--    All attempt creation, answer saving, score calculation, and finalization are handled securely on the server side.
--    Students have restricted SELECT-only access to view their own completed attempt history.
-- 3. Lecturers and Admins maintain proper role-based scoping.
-- ============================================================================

-- 1. Ensure tables exist idempotently
CREATE TABLE IF NOT EXISTS public.utme_subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.utme_topics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject_id UUID REFERENCES public.utme_subjects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.utme_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject_id UUID REFERENCES public.utme_subjects(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES public.utme_topics(id) ON DELETE SET NULL,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option TEXT NOT NULL,
    explanation TEXT,
    difficulty TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'draft',
    year TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.utme_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.utme_subjects(id) ON DELETE CASCADE,
    mode TEXT DEFAULT 'full',
    score INTEGER DEFAULT 0,
    total_correct INTEGER DEFAULT 0,
    total_wrong INTEGER DEFAULT 0,
    total_unanswered INTEGER DEFAULT 0,
    percentage NUMERIC(5,2) DEFAULT 0.00,
    time_used INTEGER DEFAULT 0,
    answers JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.utme_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utme_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utme_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utme_attempts ENABLE ROW LEVEL SECURITY;

-- 2. Drop ALL legacy or conflicting policies across UTME tables to guarantee clean state
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename IN ('utme_subjects', 'utme_topics', 'utme_questions', 'utme_attempts')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 3. Establish Strict RLS Policies

-- === UTME SUBJECTS ===
CREATE POLICY "Anyone can view active utme subjects" ON public.utme_subjects 
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage utme subjects" ON public.utme_subjects 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin')
    );

-- === UTME TOPICS ===
CREATE POLICY "Anyone can view utme topics" ON public.utme_topics 
    FOR SELECT USING (true);

CREATE POLICY "Staff can manage utme topics" ON public.utme_topics 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Lecturer'))
    );

-- === UTME QUESTIONS ===
-- Staff can manage questions.
CREATE POLICY "Staff can manage utme questions" ON public.utme_questions 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Lecturer'))
    );

-- STUDENTS ARE EXPLICITLY DENIED direct SELECT access on utme_questions to protect correct_option and explanation.
CREATE POLICY "Students are denied direct utme question select" ON public.utme_questions 
    FOR SELECT USING (false);

-- === UTME ATTEMPTS ===
-- Students have SELECT-only access to view their own attempt history. They cannot INSERT, UPDATE, or DELETE attempts directly.
CREATE POLICY "Students can view their own utme attempts" ON public.utme_attempts 
    FOR SELECT USING (student_id = auth.uid());

-- Staff have full management access over UTME attempts.
CREATE POLICY "Staff can manage utme attempts" ON public.utme_attempts 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Lecturer'))
    );

-- 4. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_utme_questions_subject_id ON public.utme_questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_utme_attempts_student_id ON public.utme_attempts(student_id);
