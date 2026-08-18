-- ============================================================================
-- MATERIAL CONTENT EXTRACTION & STATUS MIGRATION (0040)
-- 100% Idempotent. Adds extraction status and metadata tracking to lesson_ai_index.
-- ============================================================================

ALTER TABLE public.lesson_ai_index ADD COLUMN IF NOT EXISTS extraction_status TEXT DEFAULT 'indexed';
ALTER TABLE public.lesson_ai_index ADD COLUMN IF NOT EXISTS extraction_error TEXT;

-- Update sync trigger to default extraction_status to 'indexed' for text/direct content, 'pending' for files without content
CREATE OR REPLACE FUNCTION sync_undergraduate_material_ai_index()
returns TRIGGER AS $$
DECLARE
    v_level TEXT;
    v_course_code TEXT;
    v_course_title TEXT;
    v_topic_name TEXT;
    v_is_published BOOLEAN;
    v_extraction_status TEXT;
BEGIN
    SELECT 
        c.level, c.course_code, c.title, cm.name, (c.is_published AND cm.is_published AND NEW.is_published)
    INTO 
        v_level, v_course_code, v_course_title, v_topic_name, v_is_published
    FROM public.course_modules cm
    JOIN public.courses c ON c.id = cm.course_id
    WHERE cm.id = NEW.module_id;

    -- Determine extraction status based on material type and content presence
    IF NEW.material_type = 'text' OR (NEW.content IS NOT NULL AND length(trim(NEW.content)) > 0) THEN
        v_extraction_status := 'indexed';
    ELSIF NEW.material_type IN ('pdf', 'document', 'image', 'audio', 'video') AND (NEW.file_url IS NOT NULL) THEN
        v_extraction_status := 'pending';
    ELSE
        v_extraction_status := 'unavailable';
    END IF;

    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.lesson_ai_index (
            lesson_id, level, course_code, course_title, topic_name, title, material_type, content, is_published, extraction_status
        )
        VALUES (
            NEW.id, v_level, v_course_code, v_course_title, v_topic_name, NEW.title, NEW.material_type, COALESCE(NEW.content, NEW.description), COALESCE(v_is_published, true), v_extraction_status
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
            extraction_status = v_extraction_status,
            updated_at = now()
        WHERE lesson_id = NEW.id;
        
        IF NOT FOUND THEN
            INSERT INTO public.lesson_ai_index (
                lesson_id, level, course_code, course_title, topic_name, title, material_type, content, is_published, extraction_status
            )
            VALUES (
                NEW.id, v_level, v_course_code, v_course_title, v_topic_name, NEW.title, NEW.material_type, COALESCE(NEW.content, NEW.description), COALESCE(v_is_published, true), v_extraction_status
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
