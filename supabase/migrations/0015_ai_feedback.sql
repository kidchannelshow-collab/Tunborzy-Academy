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
