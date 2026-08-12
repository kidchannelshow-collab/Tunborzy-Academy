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
