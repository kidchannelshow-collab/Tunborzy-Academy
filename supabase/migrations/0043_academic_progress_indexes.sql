-- ============================================================================
-- ACADEMIC PROGRESS DATABASE OPTIMIZATION MIGRATION (0043)
-- 100% Idempotent. Adds high-performance indexes for undergraduate academic progress,
-- CBT attempts, student analytics, course enrollments, and question filtering.
-- ============================================================================

-- 1. CBT Attempts Indexes for Analytics & History queries
CREATE INDEX IF NOT EXISTS idx_cbt_attempts_user_status ON public.cbt_attempts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_cbt_attempts_exam_id ON public.cbt_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_cbt_attempts_end_time ON public.cbt_attempts(end_time DESC);

-- 2. CBT Questions Indexes for Course/Topic filtering
CREATE INDEX IF NOT EXISTS idx_cbt_questions_exam_id ON public.cbt_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_cbt_questions_course_code ON public.cbt_questions(course_code);
CREATE INDEX IF NOT EXISTS idx_cbt_questions_topic ON public.cbt_questions(topic);

-- 3. Courses & Enrollments Indexes for Lecturer and Student mapping
CREATE INDEX IF NOT EXISTS idx_courses_lecturer_id ON public.courses(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_courses_course_code ON public.courses(course_code);

DO $$ 
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'course_enrollments'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON public.course_enrollments(course_id);
        CREATE INDEX IF NOT EXISTS idx_course_enrollments_student_id ON public.course_enrollments(student_id);
    END IF;
END $$;
