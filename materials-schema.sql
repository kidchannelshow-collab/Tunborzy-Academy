-- Material Management System Schema

-- 1. Materials Table
CREATE TABLE IF NOT EXISTS public.materials (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  lecturer_name text,
  file_url text NOT NULL,
  file_type text NOT NULL, -- pdf, video, audio, ppt, doc, zip, image, link
  file_size text,
  thumbnail_url text,
  
  -- Categorization
  portal text NOT NULL, -- UTME, Post-UTME, Undergraduate
  subject text,
  course_code text,
  semester text,
  faculty text,
  department text,
  level text,
  topic text,
  
  -- Stats
  downloads_count int DEFAULT 0,
  views_count int DEFAULT 0,
  
  -- Admin
  is_published boolean DEFAULT true,
  release_date timestamptz,
  expiry_date timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Material Downloads (Tracking)
CREATE TABLE IF NOT EXISTS public.material_downloads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id uuid REFERENCES public.materials(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  device_info text,
  downloaded_at timestamptz DEFAULT now()
);

-- 3. Saved Materials / Bookmarks
CREATE TABLE IF NOT EXISTS public.saved_materials (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  material_id uuid REFERENCES public.materials(id) ON DELETE CASCADE,
  collection_name text DEFAULT 'Saved',
  saved_at timestamptz DEFAULT now(),
  UNIQUE(user_id, material_id, collection_name)
);

-- 4. Material Notes
CREATE TABLE IF NOT EXISTS public.material_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  material_id uuid REFERENCES public.materials(id) ON DELETE CASCADE,
  content text NOT NULL,
  timestamp text, -- e.g. video timestamp or pdf page
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Material Progress
CREATE TABLE IF NOT EXISTS public.material_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  material_id uuid REFERENCES public.materials(id) ON DELETE CASCADE,
  progress_percent int DEFAULT 0,
  last_position text, -- page number or video time
  last_accessed_at timestamptz DEFAULT now(),
  is_completed boolean DEFAULT false,
  UNIQUE(user_id, material_id)
);

-- Set up RLS
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_progress ENABLE ROW LEVEL SECURITY;

-- Materials RLS: everyone can read published, only admin can insert/update
CREATE POLICY "Public read published materials" ON public.materials
  FOR SELECT USING (is_published = true AND (release_date IS NULL OR release_date <= now()) AND (expiry_date IS NULL OR expiry_date >= now()));

CREATE POLICY "Admin full access materials" ON public.materials
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin' OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'lecturer'
  );

-- Users can manage their own downloads, saves, notes, progress
CREATE POLICY "Users manage own data downloads" ON public.material_downloads FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own data saves" ON public.saved_materials FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own data notes" ON public.material_notes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own data progress" ON public.material_progress FOR ALL USING (auth.uid() = user_id);
