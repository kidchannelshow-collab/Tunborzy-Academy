-- ============================================================================
-- MATERIAL AI SOURCE ARCHITECTURE MIGRATION (0038)
-- 100% Idempotent. Connects Undergraduate Academic Management (courses, course_modules, course_lessons)
-- directly to AI Indexing, ensuring automatic synchronization and publication filters.
-- ============================================================================

-- 1. Ensure lesson_ai_index exists and holds comprehensive undergraduate metadata
CREATE TABLE IF NOT EXISTS public.lesson_ai_index (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id UUID REFERENCES public.course_lessons(id) ON DELETE CASCADE,
    level TEXT,
    course_code TEXT,
    course_title TEXT,
    topic_name TEXT,
    title TEXT NOT NULL,
    material_type TEXT,
    content TEXT,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Trigger function to sync course_lessons to lesson_ai_index automatically
CREATE OR REPLACE FUNCTION sync_undergraduate_material_ai_index()
returns TRIGGER AS $$
DECLARE
    v_level TEXT;
    v_course_code TEXT;
    v_course_title TEXT;
    v_topic_name TEXT;
    v_is_published BOOLEAN;
BEGIN
    -- Fetch course and module details
    SELECT 
        c.level, c.course_code, c.title, cm.name, (c.is_published AND cm.is_published AND NEW.is_published)
    INTO 
        v_level, v_course_code, v_course_title, v_topic_name, v_is_published
    FROM public.course_modules cm
    JOIN public.courses c ON c.id = cm.course_id
    WHERE cm.id = NEW.module_id;

    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.lesson_ai_index (
            lesson_id, level, course_code, course_title, topic_name, title, material_type, content, is_published
        )
        VALUES (
            NEW.id, v_level, v_course_code, v_course_title, v_topic_name, NEW.title, NEW.material_type, COALESCE(NEW.content, NEW.description), COALESCE(v_is_published, true)
        );
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE public.lesson_ai_index 
        SET 
            level = v_level,
            course_code = v_course_code,
            course_title = v_course_title,
            topic_name = v_topic_name,
            title = NEW.title,
            material_type = NEW.material_type,
            content = COALESCE(NEW.content, NEW.description),
            is_published = COALESCE(v_is_published, true),
            updated_at = now()
        WHERE lesson_id = NEW.id;
        
        IF NOT FOUND THEN
            INSERT INTO public.lesson_ai_index (
                lesson_id, level, course_code, course_title, topic_name, title, material_type, content, is_published
            )
            VALUES (
                NEW.id, v_level, v_course_code, v_course_title, v_topic_name, NEW.title, NEW.material_type, COALESCE(NEW.content, NEW.description), COALESCE(v_is_published, true)
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_undergraduate_ai_index ON public.course_lessons;
CREATE TRIGGER trigger_sync_undergraduate_ai_index
AFTER INSERT OR UPDATE ON public.course_lessons
FOR EACH ROW
EXECUTE FUNCTION sync_undergraduate_material_ai_index();

-- 3. Trigger function for deletion or unpublishing removal from active AI source
CREATE OR REPLACE FUNCTION delete_undergraduate_material_ai_index()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.lesson_ai_index WHERE lesson_id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_delete_undergraduate_ai_index ON public.course_lessons;
CREATE TRIGGER trigger_delete_undergraduate_ai_index
AFTER DELETE ON public.course_lessons
FOR EACH ROW
EXECUTE FUNCTION delete_undergraduate_material_ai_index();

-- 4. Enable RLS on AI index
ALTER TABLE public.lesson_ai_index ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view published ai index" ON public.lesson_ai_index;
CREATE POLICY "Students can view published ai index" ON public.lesson_ai_index
    FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Staff can manage ai index" ON public.lesson_ai_index;
CREATE POLICY "Staff can manage ai index" ON public.lesson_ai_index
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Lecturer'))
    );

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_lesson_ai_index_lesson_id ON public.lesson_ai_index(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_ai_index_published ON public.lesson_ai_index(is_published);
