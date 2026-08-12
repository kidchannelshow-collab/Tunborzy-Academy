ALTER TABLE public.ai_conversations 
ADD COLUMN IF NOT EXISTS messages_count integer DEFAULT 2;
