CREATE OR REPLACE FUNCTION search_lessons_fts(search_query text)
RETURNS TABLE (
  lesson_id uuid,
  subject text,
  course text,
  topic text,
  title text,
  content text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.lesson_id, l.subject, l.course, l.topic, l.title, l.content
  FROM lesson_ai_index l
  WHERE 
    to_tsvector('english', coalesce(l.title,'') || ' ' || coalesce(l.content,'') || ' ' || coalesce(l.topic,'') || ' ' || coalesce(l.subject,'') || ' ' || coalesce(l.course,'')) @@ plainto_tsquery('english', search_query)
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
