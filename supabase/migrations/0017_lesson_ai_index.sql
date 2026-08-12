CREATE TABLE IF NOT EXISTS public.lesson_ai_index (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id uuid REFERENCES public.course_lessons(id) ON DELETE CASCADE,
    subject text,
    course text,
    topic text,
    title text NOT NULL,
    content text,
    keywords text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.lesson_ai_index ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read lesson_ai_index"
    ON public.lesson_ai_index
    FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage lesson_ai_index"
    ON public.lesson_ai_index
    FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'lecturer')));

-- Function to handle indexing on insert/update of course_lessons
CREATE OR REPLACE FUNCTION sync_lesson_ai_index()
RETURNS TRIGGER AS $$
DECLARE
    v_topic text;
    v_course text;
    v_subject text;
BEGIN
    -- Only index published lessons, optionally. Let's index all, or maybe only published. Let's index all.
    -- Get topic title (from course_modules)
    SELECT title, course_id INTO v_topic FROM public.course_modules WHERE id = NEW.module_id;
    
    -- Get course title and subject (from courses)
    SELECT title, department INTO v_course, v_subject FROM public.courses WHERE id = (SELECT course_id FROM public.course_modules WHERE id = NEW.module_id LIMIT 1);
    
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.lesson_ai_index (lesson_id, subject, course, topic, title, content)
        VALUES (NEW.id, v_subject, v_course, v_topic, NEW.title, NEW.content);
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE public.lesson_ai_index 
        SET 
            subject = v_subject,
            course = v_course,
            topic = v_topic,
            title = NEW.title, 
            content = NEW.content,
            updated_at = now()
        WHERE lesson_id = NEW.id;
        
        IF NOT FOUND THEN
            INSERT INTO public.lesson_ai_index (lesson_id, subject, course, topic, title, content)
            VALUES (NEW.id, v_subject, v_course, v_topic, NEW.title, NEW.content);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_lesson_ai_index ON public.course_lessons;
CREATE TRIGGER trigger_sync_lesson_ai_index
AFTER INSERT OR UPDATE OF title, content, module_id
ON public.course_lessons
FOR EACH ROW
EXECUTE FUNCTION sync_lesson_ai_index();

-- Also handle deletion
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

-- Backfill existing data
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
ON CONFLICT DO NOTHING;

