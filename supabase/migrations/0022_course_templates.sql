CREATE TABLE IF NOT EXISTS public.course_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  structure jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.course_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access course_templates" ON public.course_templates
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
