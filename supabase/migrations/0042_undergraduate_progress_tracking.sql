-- ============================================================================
-- UNDERGRADUATE ACADEMIC PROGRESS TRACKING MIGRATION (0042)
-- 100% Idempotent. Adds student material progress and performance tracking tables.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.student_material_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.course_lessons(id) ON DELETE CASCADE,
    is_viewed BOOLEAN DEFAULT true,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, lesson_id)
);

ALTER TABLE public.student_material_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can manage own material progress" ON public.student_material_progress;
CREATE POLICY "Students can manage own material progress" ON public.student_material_progress
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff can view student material progress" ON public.student_material_progress;
CREATE POLICY "Staff can view student material progress" ON public.student_material_progress
    For SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Lecturer'))
    );

CREATE INDEX IF NOT EXISTS idx_student_material_progress_user ON public.student_material_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_student_material_progress_lesson ON public.student_material_progress(lesson_id);
