-- UTME CBT System Schema

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
    correct_option TEXT NOT NULL, -- 'A', 'B', 'C', 'D'
    explanation TEXT,
    difficulty TEXT DEFAULT 'medium', -- 'easy', 'medium', 'hard'
    status TEXT DEFAULT 'draft', -- 'draft', 'under_review', 'approved', 'published'
    year TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.utme_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.utme_subjects(id) ON DELETE CASCADE,
    mode TEXT DEFAULT 'full', -- 'full', 'topic', 'random'
    score INTEGER DEFAULT 0,
    total_correct INTEGER DEFAULT 0,
    total_wrong INTEGER DEFAULT 0,
    total_unanswered INTEGER DEFAULT 0,
    percentage NUMERIC(5,2) DEFAULT 0.00,
    time_used INTEGER DEFAULT 0, -- in seconds
    answers JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'completed', -- 'in_progress', 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.lecturer_utme_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lecturer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.utme_subjects(id) ON DELETE CASCADE,
    UNIQUE(lecturer_id, subject_id)
);

-- Seed initial UTME subjects
INSERT INTO public.utme_subjects (name, code, description) VALUES
('English Language', 'ENG', 'Compulsory use of English language test for UTME candidates.'),
('Mathematics', 'MTH', 'General Mathematics and quantitative reasoning.'),
('Physics', 'PHY', 'Fundamental physics principles, mechanics, and electricity.'),
('Chemistry', 'CHM', 'Organic, inorganic, and physical chemistry.'),
('Biology', 'BIO', 'General biology, ecology, and human anatomy.')
ON CONFLICT (name) DO NOTHING;

-- RLS Enable
ALTER TABLE public.utme_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utme_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utme_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utme_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecturer_utme_assignments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active utme subjects" ON public.utme_subjects FOR SELECT USING (true);
CREATE POLICY "Admins can manage utme subjects" ON public.utme_subjects FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin')
);

CREATE POLICY "Anyone can view utme topics" ON public.utme_topics FOR SELECT USING (true);
CREATE POLICY "Staff can manage utme topics" ON public.utme_topics FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'Admin' OR role = 'Lecturer'))
);

CREATE POLICY "Students can view published utme questions" ON public.utme_questions FOR SELECT USING (
  status = 'published' OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Lecturer'))
);

CREATE POLICY "Staff can manage utme questions" ON public.utme_questions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Lecturer'))
);

CREATE POLICY "Students can manage their own utme attempts" ON public.utme_attempts FOR ALL USING (
  student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Lecturer'))
);

CREATE POLICY "Admins can manage lecturer assignments" ON public.lecturer_utme_assignments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin')
);
