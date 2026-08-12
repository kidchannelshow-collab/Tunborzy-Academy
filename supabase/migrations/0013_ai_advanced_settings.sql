ALTER TABLE public.ai_settings
ADD COLUMN IF NOT EXISTS daily_limit integer DEFAULT 1000,
ADD COLUMN IF NOT EXISTS student_limit integer DEFAULT 50,
ADD COLUMN IF NOT EXISTS block_offensive boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS academic_only boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_logging boolean DEFAULT true;
