-- Function to handle indexing on insert/update of materials
CREATE OR REPLACE FUNCTION sync_material_ai_index()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.lesson_ai_index (lesson_id, subject, course, topic, title, content)
        VALUES (NEW.id, NEW.subject, NEW.course_code, NEW.topic, NEW.title, NEW.description);
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE public.lesson_ai_index 
        SET 
            subject = NEW.subject,
            course = NEW.course_code,
            topic = NEW.topic,
            title = NEW.title, 
            content = NEW.description,
            updated_at = now()
        WHERE lesson_id = NEW.id;
        
        IF NOT FOUND THEN
            INSERT INTO public.lesson_ai_index (lesson_id, subject, course, topic, title, content)
            VALUES (NEW.id, NEW.subject, NEW.course_code, NEW.topic, NEW.title, NEW.description);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_material_ai_index ON public.materials;
CREATE TRIGGER trigger_sync_material_ai_index
AFTER INSERT OR UPDATE OF title, description, subject, course_code, topic
ON public.materials
FOR EACH ROW
EXECUTE FUNCTION sync_material_ai_index();

-- Also handle deletion
CREATE OR REPLACE FUNCTION delete_material_ai_index()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.lesson_ai_index WHERE lesson_id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_delete_material_ai_index ON public.materials;
CREATE TRIGGER trigger_delete_material_ai_index
AFTER DELETE ON public.materials
FOR EACH ROW
EXECUTE FUNCTION delete_material_ai_index();

-- Backfill existing data
INSERT INTO public.lesson_ai_index (lesson_id, subject, course, topic, title, content)
SELECT 
    id as lesson_id, 
    subject,
    course_code as course, 
    topic, 
    title, 
    description as content
FROM public.materials
ON CONFLICT DO NOTHING;
