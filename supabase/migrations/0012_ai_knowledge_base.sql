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
