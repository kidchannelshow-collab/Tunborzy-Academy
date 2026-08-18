-- ============================================================================
-- UNDERGRADUATE ACADEMIC HIERARCHY MIGRATION (0036)
-- 100% Idempotent. Preserves existing tables, columns, and data.
-- Establishes undergraduate academic hierarchy: Level -> Course -> Topic -> Learning Material
-- ============================================================================

-- 1. Ensure courses table has undergraduate level column and status/description
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS level TEXT DEFAULT '100 Level';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS course_code TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Ensure course_modules (or topics) and course_lessons (or learning materials) exist and support hierarchy
-- If course_modules represents topics, add order and description if needed
ALTER TABLE public.course_modules ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.course_modules ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Ensure course_lessons represents learning materials
ALTER TABLE public.course_lessons ADD COLUMN IF NOT EXISTS material_type TEXT DEFAULT 'pdf';
ALTER TABLE public.course_lessons ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.course_lessons ADD COLUMN IF NOT EXISTS content TEXT;

-- 3. Enable RLS and verify policies
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;

-- 4. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_courses_level ON public.courses(level);
CREATE INDEX IF NOT EXISTS idx_course_modules_course_id ON public.course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_module_id ON public.course_lessons(module_id);
