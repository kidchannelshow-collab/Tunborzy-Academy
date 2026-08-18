-- ============================================================================
-- UNDERGRADUATE CBT HIERARCHY CONNECTION MIGRATION (0041)
-- 100% Idempotent. Connects cbt_exams and cbt_questions to undergraduate courses & modules.
-- ============================================================================

-- 1. Ensure cbt_exams can link directly to courses and levels
ALTER TABLE public.cbt_exams ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE;
ALTER TABLE public.cbt_exams ADD COLUMN IF NOT EXISTS level TEXT DEFAULT '100 Level';

-- 2. Ensure cbt_questions can link directly to course_modules (topics)
ALTER TABLE public.cbt_questions ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES public.course_modules(id) ON DELETE SET NULL;
ALTER TABLE public.cbt_questions ADD COLUMN IF NOT EXISTS level TEXT DEFAULT '100 Level';
ALTER TABLE public.cbt_questions ADD COLUMN IF NOT EXISTS course_code TEXT;

-- 3. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_cbt_exams_course_id ON public.cbt_exams(course_id);
CREATE INDEX IF NOT EXISTS idx_cbt_questions_module_id ON public.cbt_questions(module_id);
CREATE INDEX IF NOT EXISTS idx_cbt_exams_level ON public.cbt_exams(level);
