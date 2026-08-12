CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject text,
    topic text,
    response_time integer,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own AI conversations"
    ON public.ai_conversations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all AI conversations"
    ON public.ai_conversations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE OR REPLACE FUNCTION get_ai_statistics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_questions integer;
  questions_today integer;
  active_sessions integer;
  avg_response_time integer;
  unique_students integer;
  top_subject text;
  top_topic text;
BEGIN
  SELECT count(*) INTO total_questions FROM public.ai_conversations;
  
  SELECT count(*) INTO questions_today FROM public.ai_conversations 
  WHERE created_at >= date_trunc('day', now());
  
  SELECT count(distinct user_id) INTO active_sessions FROM public.ai_conversations
  WHERE created_at >= now() - interval '1 hour';
  
  SELECT coalesce(avg(response_time), 0)::integer INTO avg_response_time FROM public.ai_conversations;
  
  SELECT count(distinct user_id) INTO unique_students FROM public.ai_conversations;
  
  SELECT subject INTO top_subject FROM public.ai_conversations 
  GROUP BY subject ORDER BY count(*) DESC LIMIT 1;
  
  SELECT topic INTO top_topic FROM public.ai_conversations 
  GROUP BY topic ORDER BY count(*) DESC LIMIT 1;

  RETURN json_build_object(
    'totalQuestions', total_questions,
    'questionsToday', questions_today,
    'activeSessions', active_sessions,
    'avgResponseTime', avg_response_time,
    'uniqueStudents', unique_students,
    'topSubject', coalesce(top_subject, '--'),
    'topTopic', coalesce(top_topic, '--')
  );
END;
$$;
