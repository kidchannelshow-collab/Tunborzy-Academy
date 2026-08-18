-- ============================================================================
-- AUTOMATIC ACADEMIC MATERIAL FTS SEARCH MIGRATION (0039)
-- 100% Idempotent. Enhances lesson_ai_index with Full-Text Search and secure retrieval function.
-- ============================================================================

-- 1. Ensure Full-Text Search vector column exists on lesson_ai_index
ALTER TABLE public.lesson_ai_index ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 2. Create or update function to automatically compute search vector on insert/update
CREATE OR REPLACE FUNCTION update_lesson_ai_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.course_code, '') || ' ' || COALESCE(NEW.course_title, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.topic_name, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_lesson_ai_search_vector ON public.lesson_ai_index;
CREATE TRIGGER trigger_update_lesson_ai_search_vector
BEFORE INSERT OR UPDATE ON public.lesson_ai_index
FOR EACH ROW
EXECUTE FUNCTION update_lesson_ai_search_vector();

-- 3. Backfill search vectors for existing rows
UPDATE public.lesson_ai_index 
SET search_vector = 
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(course_code, '') || ' ' || COALESCE(course_title, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(topic_name, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(content, '')), 'D');

-- 4. Create GIN index for blazing-fast full-text search performance
CREATE INDEX IF NOT EXISTS idx_lesson_ai_search_vector ON public.lesson_ai_index USING gin(search_vector);

-- 5. Secure FTS search function restricted to published materials
CREATE OR REPLACE FUNCTION search_undergraduate_materials_fts(search_query text)
RETURNS TABLE (
    lesson_id uuid,
    level text,
    course_code text,
    course_title text,
    topic_name text,
    title text,
    material_type text,
    content text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.lesson_id, l.level, l.course_code, l.course_title, l.topic_name, l.title, l.material_type, l.content
    FROM public.lesson_ai_index l
    WHERE l.is_published = true
      AND l.search_vector @@ plainto_tsquery('english', search_query)
    ORDER BY ts_rank(l.search_vector, plainto_tsquery('english', search_query)) DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
