-- ============================================================================
-- UNDERGRADUATE MATERIAL PUBLICATION RLS AUDIT MIGRATION (0037)
-- 100% Idempotent. Preserves existing tables, columns, and data.
-- Ensures unpublished materials and courses remain inaccessible to students.
-- ============================================================================

-- 1. Ensure publication status columns exist
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
ALTER TABLE public.course_modules ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
ALTER TABLE public.course_lessons ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

-- 2. Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;

-- 3. Drop conflicting policies safely
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename IN ('courses', 'course_modules', 'course_lessons')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 4. Establish Publication & Role Policies

-- === COURSES ===
CREATE POLICY "Anyone can view published courses" ON public.courses
    FOR SELECT USING (is_published = true OR is_published IS NULL);

CREATE POLICY "Staff can manage courses" ON public.courses
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Lecturer'))
    );

-- === COURSE MODULES (TOPICS) ===
CREATE POLICY "Anyone can view published course modules" ON public.course_modules
    FOR SELECT USING (is_published = true OR is_published IS NULL);

CREATE POLICY "Staff can manage course modules" ON public.course_modules
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Lecturer'))
    );

-- === COURSE LESSONS (LEARNING MATERIALS) ===
CREATE POLICY "Anyone can view published course lessons" ON public.course_lessons
    FOR SELECT USING (is_published = true OR is_published IS NULL);

CREATE POLICY "Staff can manage course lessons" ON public.course_lessons
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Lecturer'))
    );

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_courses_is_published ON public.courses(is_published);
CREATE INDEX IF NOT EXISTS idx_course_modules_is_published ON public.course_modules(is_published);
CREATE INDEX IF NOT EXISTS idx_course_lessons_is_published ON public.course_lessons(is_published);
