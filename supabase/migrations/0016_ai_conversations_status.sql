ALTER TABLE public.ai_conversations ADD COLUMN IF NOT EXISTS status text DEFAULT 'success';
