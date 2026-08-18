-- ============================================================================
-- POST-UTME CBT STRUCTURE MIGRATION (0034)
-- 100% Idempotent. Preserves all existing tables, columns, and data.
-- Establishes dedicated Post-UTME tables (post_utme_exams, post_utme_questions, post_utme_attempts)
-- completely isolated from Undergraduate CBT and UTME CBT.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.post_utme_exams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    university TEXT NOT NULL, -- e.g., 'UNILAG', 'UI', 'UNN', 'OAU', 'ABU'
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

-- Clean up any prior policies safely
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

-- RLS Policies
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

-- Questions: Staff can manage. Students are strictly denied direct SELECT to protect correct_option and explanation.
CREATE POLICY "Staff can manage post-utme questions" ON public.post_utme_questions 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('Admin', 'Lecturer'))
    );

CREATE POLICY "Students are denied direct post-utme question select" ON public.post_utme_questions 
    FOR SELECT USING (false);

-- Attempts: Students view only their own. Staff have oversight.
CREATE POLICY "Students can view their own post-utme attempts" ON public.post_utme_attempts 
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admin can manage all post-utme attempts" ON public.post_utme_attempts 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'Admin')
    );

CREATE POLICY "Lecturer can manage attempts for their own post-utme exams" ON public.post_utme_attempts 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.post_utme_exams 
            WHERE post_utme_exams.id = post_utme_attempts.exam_id AND post_utme_exams.created_by = auth.uid()
        )
        AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'Lecturer')
    );

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_post_utme_questions_exam_id ON public.post_utme_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_post_utme_attempts_exam_id ON public.post_utme_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_post_utme_attempts_user_id ON public.post_utme_attempts(user_id);
