CREATE OR REPLACE FUNCTION search_lessons(search_query text)
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
    l.title ILIKE '%' || search_query || '%' OR 
    l.content ILIKE '%' || search_query || '%' OR 
    l.topic ILIKE '%' || search_query || '%'
  LIMIT 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
