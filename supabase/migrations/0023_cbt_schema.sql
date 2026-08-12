-- CBT Schema

CREATE TABLE IF NOT EXISTS public.cbt_exams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    course_code TEXT,
    topic TEXT,
    subject TEXT, -- for legacy or JAMB if needed
    portal TEXT, -- 'Undergraduate', 'JAMB', etc.
    duration_minutes INTEGER DEFAULT 60,
    is_published BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.cbt_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_id UUID REFERENCES public.cbt_exams(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option TEXT NOT NULL, -- 'A', 'B', 'C', 'D'
    explanation TEXT,
    marks INTEGER DEFAULT 1,
    topic TEXT,
    difficulty TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.cbt_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_id UUID REFERENCES public.cbt_exams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed'
    score INTEGER DEFAULT 0,
    total_correct INTEGER DEFAULT 0,
    total_wrong INTEGER DEFAULT 0,
    answers JSONB DEFAULT '{}'::jsonb,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE
);

-- RLS
ALTER TABLE public.cbt_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_attempts ENABLE ROW LEVEL SECURITY;

-- Exams: Anyone can read published exams. Lecturers/Admins can read all.
CREATE POLICY "Public can view published exams" ON public.cbt_exams FOR SELECT USING (is_published = true);
CREATE POLICY "Staff can manage exams" ON public.cbt_exams FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND (profiles.role = 'Admin' OR profiles.role = 'Lecturer')
  )
);

-- Questions: Anyone can read questions of published exams (needed for taking exam).
-- Wait, students shouldn't get all questions if we want server-side evaluation, but for a client-side CBT it's fine. 
-- The prompt says: "Do NOT trust the frontend to determine correct answers... Validate these on the backend... A student must not be able to manipulate a request and retrieve: Answer keys".
-- Ah! If answer keys are stored in `cbt_questions`, then students shouldn't be able to query `correct_option` before submission.
-- Since this is Supabase RLS, it's hard to restrict column visibility dynamically. 
-- But we can create a secure function to submit answers!
