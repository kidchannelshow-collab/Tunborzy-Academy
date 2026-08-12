ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0;
