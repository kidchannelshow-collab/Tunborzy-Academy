CREATE TABLE IF NOT EXISTS public.ai_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  enabled boolean DEFAULT true,
  welcome_message text DEFAULT 'Hello! Welcome to Tunborzy AI. Ask me anything about your studies.',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage ai_settings" 
ON public.ai_settings
FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Anyone can read ai_settings"
ON public.ai_settings
FOR SELECT
TO authenticated
USING (true);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.ai_settings) THEN
    INSERT INTO public.ai_settings (enabled, welcome_message)
    VALUES (true, 'Hello! Welcome to Tunborzy AI. Ask me anything about your studies.');
  END IF;
END
$$;
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
ALTER TABLE public.ai_settings 
ADD COLUMN IF NOT EXISTS system_prompt text DEFAULT 'You are TONBORZY AI Tutor, a helpful academic assistant for an educational platform. You help students with their studies, explain concepts step by step, and solve problems with worked solutions. Explain science, engineering, computing concepts, and university-level topics. Help students prepare for CBT examinations, generate quizzes when requested, summarize academic notes, simplify difficult concepts, and recommend study strategies. If course materials are provided, use them as the highest-priority knowledge source. Otherwise, use your general educational knowledge. Never return fake information. If the answer is uncertain, state that clearly instead of inventing facts. Encourage learning instead of cheating, explain answers instead of only giving results, use clear language, and maintain a professional tone. Never expose that you are Gemini, identify yourself only as TONBORZY AI Tutor. If you need more information, use Google Search.',
ADD COLUMN IF NOT EXISTS personality text DEFAULT 'Professional and encouraging',
ADD COLUMN IF NOT EXISTS teaching_style text DEFAULT 'Step-by-step guidance',
ADD COLUMN IF NOT EXISTS answer_length text DEFAULT 'Detailed',
ADD COLUMN IF NOT EXISTS language text DEFAULT 'English';
-- Create knowledge base table
CREATE TABLE IF NOT EXISTS public.ai_knowledge_base (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    file_name text NOT NULL,
    file_path text NOT NULL,
    mime_type text NOT NULL,
    size integer NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.ai_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Policies for admins
CREATE POLICY "Admins can manage knowledge base"
    ON public.ai_knowledge_base
    FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Anyone can read knowledge base
CREATE POLICY "Anyone can read knowledge base"
    ON public.ai_knowledge_base
    FOR SELECT
    USING (true);

-- Storage bucket for knowledge base
INSERT INTO storage.buckets (id, name, public) VALUES ('knowledge_base', 'knowledge_base', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admin can upload KB files"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'knowledge_base' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
    
CREATE POLICY "Admin can update KB files"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'knowledge_base' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
    
CREATE POLICY "Admin can delete KB files"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'knowledge_base' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Anyone can read KB files"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'knowledge_base');
ALTER TABLE public.ai_settings
ADD COLUMN IF NOT EXISTS daily_limit integer DEFAULT 1000,
ADD COLUMN IF NOT EXISTS student_limit integer DEFAULT 50,
ADD COLUMN IF NOT EXISTS block_offensive boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS academic_only boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_logging boolean DEFAULT true;
ALTER TABLE public.ai_conversations 
ADD COLUMN IF NOT EXISTS messages_count integer DEFAULT 2;
CREATE TABLE IF NOT EXISTS public.ai_feedback (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    message_id text,
    prompt text,
    response text,
    is_helpful boolean,
    comment text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own feedback"
    ON public.ai_feedback
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own feedback"
    ON public.ai_feedback
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback"
    ON public.ai_feedback
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );
ALTER TABLE public.ai_conversations ADD COLUMN IF NOT EXISTS status text DEFAULT 'success';
