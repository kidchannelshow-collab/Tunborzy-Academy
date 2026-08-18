-- ============================================================================
-- POST-UTME SECURITY & RLS AUDIT MIGRATION (0035)
-- 100% Idempotent. Preserves all existing tables, columns, and data.
-- 
-- SECURITY GUARANTEES:
-- 1. Students are strictly denied direct SELECT access to post_utme_questions (FOR SELECT USING (false)).
--    All questions are served exclusively via the secure Express backend proxy endpoints (/api/post-utme/start).
-- 2. Students are strictly denied direct INSERT, UPDATE, or DELETE access to post_utme_attempts.
--    All attempt creation, answer saving, score calculation, and finalization are handled securely on the server side.
--    Students have restricted SELECT-only access to view their own completed attempt history.
-- 3. Lecturers and Admins maintain proper role-based scoping.
-- ============================================================================

-- 1. Ensure tables exist idempotently
CREATE TABLE IF NOT EXISTS public.post_utme_exams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    university TEXT NOT NULL,
    course_code TEXT,
    subject TEXT NOT NULL,
    year TEXT,
    duration_minutes INTEGER DEFAULT 60,
    is_published BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.post_utme_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_id UUID REFERENCES public.post_utme_exams(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option TEXT NOT NULL,
    explanation TEXT,
    marks INTEGER DEFAULT 1,
    topic TEXT,
    difficulty TEXT DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.post_utme_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_id UUID REFERENCES public.post_utme_exams(id) ON DELETE CASCADE,
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
ALTER TABLE public.post_utme_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_utme_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_utme_attempts ENABLE ROW LEVEL SECURITY;

-- 2. Drop ALL legacy or conflicting policies across Post-UTME tables to guarantee clean state
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename IN ('post_utme_exams', 'post_utme_questions', 'post_utme_attempts')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 3. Establish Strict RLS Policies

-- === POST-UTME EXAMS ===
CREATE POLICY "Public can view published post-utme exams" ON public.post_utme_exams 
    FOR SELECT USING (is_published = true);

CREATE POLICY "Admin can manage all post-utme exams" ON public.post_utme_exams 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'Admin')
    );

CREATE POLICY "Lecturer can manage their own post-utme exams" ON public.post_utme_exams 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'Lecturer')
        AND created_by = auth.uid()
    );

-- === POST-UTME QUESTIONS ===
-- Staff can manage questions for exams they are authorized for.
CREATE POLICY "Staff can manage post-utme questions" ON public.post_utme_questions 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'Admin')
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.post_utme_exams e ON e.created_by = p.id
            WHERE p.id = auth.uid() AND p.role = 'Lecturer' AND e.id = post_utme_questions.exam_id
        )
    );

-- STUDENTS ARE EXPLICITLY DENIED direct SELECT access on post_utme_questions to protect correct_option and explanation.
CREATE POLICY "Students are denied direct post-utme question select" ON public.post_utme_questions 
    FOR SELECT USING (false);

-- === POST-UTME ATTEMPTS ===
-- Students have SELECT-only access to view their own attempt history. They cannot INSERT, UPDATE, or DELETE attempts directly.
CREATE POLICY "Students can view their own post-utme attempts" ON public.post_utme_attempts 
    FOR SELECT USING (user_id = auth.uid());

-- Admins have full management access over all student attempts.
CREATE POLICY "Admin can manage all post-utme attempts" ON public.post_utme_attempts 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'Admin')
    );

-- Lecturers can view/manage attempts only for Post-UTME exams they authored.
CREATE POLICY "Lecturer can manage attempts for their own post-utme exams" ON public.post_utme_attempts 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.post_utme_exams 
            WHERE post_utme_exams.id = post_utme_attempts.exam_id AND post_utme_exams.created_by = auth.uid()
        )
        AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'Lecturer')
    );

-- 4. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_post_utme_questions_exam_id ON public.post_utme_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_post_utme_attempts_exam_id ON public.post_utme_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_post_utme_attempts_user_id ON public.post_utme_attempts(user_id);
