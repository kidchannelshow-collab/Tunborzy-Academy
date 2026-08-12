-- 1. Create the AI Index Table
CREATE TABLE IF NOT EXISTS public.lesson_ai_index (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id uuid NOT NULL,
    subject text,
    course text,
    topic text,
    title text NOT NULL,
    content text,
    keywords text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure lesson_id is unique so UPSERT (ON CONFLICT) works perfectly
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_lesson_id'
    ) THEN
        ALTER TABLE public.lesson_ai_index ADD CONSTRAINT uq_lesson_id UNIQUE (lesson_id);
    END IF;
END
$$;

ALTER TABLE public.lesson_ai_index ENABLE ROW LEVEL SECURITY;

-- 2. Idempotent RLS Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'lesson_ai_index' AND policyname = 'Anyone can read lesson_ai_index'
    ) THEN
        CREATE POLICY "Anyone can read lesson_ai_index"
            ON public.lesson_ai_index
            FOR SELECT
            TO authenticated
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'lesson_ai_index' AND policyname = 'Admins can manage lesson_ai_index'
    ) THEN
        CREATE POLICY "Admins can manage lesson_ai_index"
            ON public.lesson_ai_index
            FOR ALL
            TO authenticated
            USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'lecturer')));
    END IF;
END
$$;

-- 3. Indexes (GIN for Full Text Search and B-Tree for lesson_id lookups)
CREATE INDEX IF NOT EXISTS idx_lesson_ai_index_lesson_id ON public.lesson_ai_index(lesson_id);

CREATE INDEX IF NOT EXISTS idx_lesson_ai_index_fts 
ON public.lesson_ai_index 
USING GIN (
  to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,'') || ' ' || coalesce(topic,'') || ' ' || coalesce(subject,'') || ' ' || coalesce(course,'') || ' ' || coalesce(keywords,''))
);

-- 4. Sync Functions for course_lessons (Using elegant UPSERT)
CREATE OR REPLACE FUNCTION sync_lesson_ai_index()
RETURNS TRIGGER AS $$
DECLARE
    v_topic text;
    v_course text;
    v_subject text;
BEGIN
    SELECT title, course_id INTO v_topic FROM public.course_modules WHERE id = NEW.module_id;
    SELECT title, department INTO v_course, v_subject FROM public.courses WHERE id = (SELECT course_id FROM public.course_modules WHERE id = NEW.module_id LIMIT 1);
    
    INSERT INTO public.lesson_ai_index (lesson_id, subject, course, topic, title, content)
    VALUES (NEW.id, v_subject, v_course, v_topic, NEW.title, NEW.content)
    ON CONFLICT (lesson_id) DO UPDATE 
    SET 
        subject = EXCLUDED.subject, 
        course = EXCLUDED.course, 
        topic = EXCLUDED.topic, 
        title = EXCLUDED.title, 
        content = EXCLUDED.content, 
        updated_at = now();
        
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_lesson_ai_index ON public.course_lessons;
CREATE TRIGGER trigger_sync_lesson_ai_index
AFTER INSERT OR UPDATE OF title, content, module_id
ON public.course_lessons
FOR EACH ROW
EXECUTE FUNCTION sync_lesson_ai_index();

-- Delete trigger for course_lessons
CREATE OR REPLACE FUNCTION delete_lesson_ai_index()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.lesson_ai_index WHERE lesson_id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_delete_lesson_ai_index ON public.course_lessons;
CREATE TRIGGER trigger_delete_lesson_ai_index
AFTER DELETE ON public.course_lessons
FOR EACH ROW
EXECUTE FUNCTION delete_lesson_ai_index();

-- 5. Sync Functions for materials (Using elegant UPSERT)
CREATE OR REPLACE FUNCTION sync_material_ai_index()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.lesson_ai_index (lesson_id, subject, course, topic, title, content)
    VALUES (NEW.id, NEW.subject, NEW.course_code, NEW.topic, NEW.title, NEW.description)
    ON CONFLICT (lesson_id) DO UPDATE 
    SET 
        subject = EXCLUDED.subject, 
        course = EXCLUDED.course, 
        topic = EXCLUDED.topic, 
        title = EXCLUDED.title, 
        content = EXCLUDED.content, 
        updated_at = now();
        
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_material_ai_index ON public.materials;
CREATE TRIGGER trigger_sync_material_ai_index
AFTER INSERT OR UPDATE OF title, description, subject, course_code, topic
ON public.materials
FOR EACH ROW
EXECUTE FUNCTION sync_material_ai_index();

DROP TRIGGER IF EXISTS trigger_delete_material_ai_index ON public.materials;
CREATE TRIGGER trigger_delete_material_ai_index
AFTER DELETE ON public.materials
FOR EACH ROW
EXECUTE FUNCTION delete_lesson_ai_index(); -- Reusing the same delete function

-- 6. Backfill existing data safely
INSERT INTO public.lesson_ai_index (lesson_id, subject, course, topic, title, content)
SELECT 
    cl.id as lesson_id, 
    c.department as subject,
    c.title as course, 
    cm.title as topic, 
    cl.title, 
    cl.content
FROM public.course_lessons cl
LEFT JOIN public.course_modules cm ON cl.module_id = cm.id
LEFT JOIN public.courses c ON cm.course_id = c.id
ON CONFLICT (lesson_id) DO NOTHING;

INSERT INTO public.lesson_ai_index (lesson_id, subject, course, topic, title, content)
SELECT 
    id as lesson_id, 
    subject,
    course_code as course, 
    topic, 
    title, 
    description as content
FROM public.materials
ON CONFLICT (lesson_id) DO NOTHING;

-- 7. High-Performance Full Text Search Function
CREATE OR REPLACE FUNCTION search_lessons_fts(search_query text)
RETURNS TABLE (
  lesson_id uuid,
  subject text,
  course text,
  topic text,
  title text,
  content text,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.lesson_id, l.subject, l.course, l.topic, l.title, l.content,
    ts_rank(
        to_tsvector('english', coalesce(l.title,'') || ' ' || coalesce(l.content,'') || ' ' || coalesce(l.topic,'') || ' ' || coalesce(l.subject,'') || ' ' || coalesce(l.course,'') || ' ' || coalesce(l.keywords,'')), 
        plainto_tsquery('english', search_query)
    ) as rank
  FROM public.lesson_ai_index l
  WHERE 
    to_tsvector('english', coalesce(l.title,'') || ' ' || coalesce(l.content,'') || ' ' || coalesce(l.topic,'') || ' ' || coalesce(l.subject,'') || ' ' || coalesce(l.course,'') || ' ' || coalesce(l.keywords,'')) 
    @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
