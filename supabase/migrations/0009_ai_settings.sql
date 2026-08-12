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
