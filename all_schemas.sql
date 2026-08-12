-- CBT Tables Schema

CREATE TABLE IF NOT EXISTS public.cbt_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    portal TEXT NOT NULL,
    semester TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    total_questions INTEGER NOT NULL DEFAULT 10,
    passing_score INTEGER NOT NULL DEFAULT 50,
    is_published BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cbt_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.cbt_exams(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_option INTEGER NOT NULL,
    explanation TEXT,
    difficulty TEXT DEFAULT 'medium',
    topic TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cbt_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.cbt_exams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    status TEXT DEFAULT 'in_progress',
    score INTEGER DEFAULT 0,
    total_correct INTEGER DEFAULT 0,
    total_wrong INTEGER DEFAULT 0,
    total_unanswered INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cbt_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID REFERENCES public.cbt_attempts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.cbt_questions(id) ON DELETE CASCADE,
    selected_option INTEGER,
    is_correct BOOLEAN,
    time_spent_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.cbt_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Exams are viewable by everyone" ON public.cbt_exams FOR SELECT USING (true);
CREATE POLICY "Admins and Lecturers can manage exams" ON public.cbt_exams FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Lecturer'))
);

CREATE POLICY "Questions are viewable by everyone" ON public.cbt_questions FOR SELECT USING (true);
CREATE POLICY "Admins and Lecturers can manage questions" ON public.cbt_questions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Lecturer'))
);

CREATE POLICY "Users can view their own attempts" ON public.cbt_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own attempts" ON public.cbt_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own attempts" ON public.cbt_attempts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own answers" ON public.cbt_answers FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.cbt_attempts WHERE id = attempt_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert their own answers" ON public.cbt_answers FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.cbt_attempts WHERE id = attempt_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update their own answers" ON public.cbt_answers FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.cbt_attempts WHERE id = attempt_id AND user_id = auth.uid())
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (true); -- In a real app, this should be restricted to authenticated users or triggers

CREATE POLICY "Users can delete their own notifications"
    ON public.notifications FOR DELETE
    USING (auth.uid() = user_id);

-- Add realtime publication for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
-- 1. Courses
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lecturer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  course_code text,
  description text,
  portal text NOT NULL, -- UTME, Post-UTME, Undergraduate
  department text,
  faculty text,
  level text,
  semester text,
  thumbnail_url text,
  cover_image_url text,
  is_archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Course Modules
CREATE TABLE IF NOT EXISTS public.course_modules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  order_index int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 3. Course Lessons
CREATE TABLE IF NOT EXISTS public.course_lessons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id uuid REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  file_url text,
  file_type text, -- video, pdf, audio, ppt, doc, link
  file_size text,
  thumbnail_url text,
  content text,
  order_index int DEFAULT 0,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Live Classes
CREATE TABLE IF NOT EXISTS public.live_classes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lecturer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  meeting_link text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  materials_url text,
  created_at timestamptz DEFAULT now()
);

-- 5. Assignments
CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lecturer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  file_url text,
  total_marks int DEFAULT 100,
  deadline timestamptz,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. Assignment Submissions
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id uuid REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_url text,
  submission_text text,
  score int,
  feedback text,
  submitted_at timestamptz DEFAULT now(),
  graded_at timestamptz,
  UNIQUE(assignment_id, student_id)
);

-- 7. Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lecturer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  target_audience text NOT NULL, -- 'All', 'Portal', 'Course', 'Department'
  target_value text, -- course_id, portal_name, department_name
  created_at timestamptz DEFAULT now()
);

-- RLS setup
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Lecturer Policies (Lecturers can manage their own, students can view)
CREATE POLICY "Lecturers manage own courses" ON public.courses FOR ALL USING (lecturer_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Students read courses" ON public.courses FOR SELECT USING (is_archived = false);

CREATE POLICY "Lecturers manage own modules" ON public.course_modules FOR ALL USING (
  EXISTS (SELECT 1 FROM public.courses WHERE id = course_modules.course_id AND lecturer_id = auth.uid()) OR auth.jwt() ->> 'role' = 'admin'
);
CREATE POLICY "Students read modules" ON public.course_modules FOR SELECT USING (true);

CREATE POLICY "Lecturers manage own lessons" ON public.course_lessons FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.course_modules cm 
    JOIN public.courses c ON cm.course_id = c.id
    WHERE cm.id = course_lessons.module_id AND c.lecturer_id = auth.uid()
  ) OR auth.jwt() ->> 'role' = 'admin'
);
CREATE POLICY "Students read published lessons" ON public.course_lessons FOR SELECT USING (is_published = true);

CREATE POLICY "Lecturers manage own live classes" ON public.live_classes FOR ALL USING (lecturer_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Students read live classes" ON public.live_classes FOR SELECT USING (true);

CREATE POLICY "Lecturers manage own assignments" ON public.assignments FOR ALL USING (lecturer_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Students read published assignments" ON public.assignments FOR SELECT USING (is_published = true);

CREATE POLICY "Students manage own submissions" ON public.assignment_submissions FOR ALL USING (student_id = auth.uid());
CREATE POLICY "Lecturers read/grade course submissions" ON public.assignment_submissions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.assignments WHERE id = assignment_submissions.assignment_id AND lecturer_id = auth.uid()) OR auth.jwt() ->> 'role' = 'admin'
);

CREATE POLICY "Lecturers manage own announcements" ON public.announcements FOR ALL USING (lecturer_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Public read announcements" ON public.announcements FOR SELECT USING (true);
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
-- Chat Rooms
CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_code TEXT NOT NULL,
  course_title TEXT NOT NULL,
  portal TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Chat Members
CREATE TABLE chat_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'student', -- 'student', 'lecturer', 'admin'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_muted BOOLEAN DEFAULT FALSE,
  UNIQUE(room_id, user_id)
);

-- Chat Messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message_text TEXT,
  file_url TEXT,
  file_type TEXT, -- 'image', 'audio', 'document'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Pinned Messages
CREATE TABLE pinned_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  pinned_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  pinned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, message_id)
);

-- Message Reads
CREATE TABLE message_reads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Message Reactions
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);
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
ALTER TABLE public.ai_settings
ADD COLUMN IF NOT EXISTS daily_limit integer DEFAULT 1000,
ADD COLUMN IF NOT EXISTS student_limit integer DEFAULT 50,
ADD COLUMN IF NOT EXISTS block_offensive boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS academic_only boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_logging boolean DEFAULT true;
ALTER TABLE public.ai_conversations 
ADD COLUMN IF NOT EXISTS messages_count integer DEFAULT 2;
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
ALTER TABLE public.ai_conversations ADD COLUMN IF NOT EXISTS status text DEFAULT 'success';
CREATE TABLE IF NOT EXISTS public.lesson_ai_index (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id uuid REFERENCES public.course_lessons(id) ON DELETE CASCADE,
    subject text,
    course text,
    topic text,
    title text NOT NULL,
    content text,
    keywords text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.lesson_ai_index ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read lesson_ai_index"
    ON public.lesson_ai_index
    FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage lesson_ai_index"
    ON public.lesson_ai_index
    FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'lecturer')));

-- Function to handle indexing on insert/update of course_lessons
CREATE OR REPLACE FUNCTION sync_lesson_ai_index()
RETURNS TRIGGER AS $$
DECLARE
    v_topic text;
    v_course text;
    v_subject text;
BEGIN
    -- Only index published lessons, optionally. Let's index all, or maybe only published. Let's index all.
    -- Get topic title (from course_modules)
    SELECT title, course_id INTO v_topic FROM public.course_modules WHERE id = NEW.module_id;
    
    -- Get course title and subject (from courses)
    SELECT title, department INTO v_course, v_subject FROM public.courses WHERE id = (SELECT course_id FROM public.course_modules WHERE id = NEW.module_id LIMIT 1);
    
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.lesson_ai_index (lesson_id, subject, course, topic, title, content)
        VALUES (NEW.id, v_subject, v_course, v_topic, NEW.title, NEW.content);
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE public.lesson_ai_index 
        SET 
            subject = v_subject,
            course = v_course,
            topic = v_topic,
            title = NEW.title, 
            content = NEW.content,
            updated_at = now()
        WHERE lesson_id = NEW.id;
        
        IF NOT FOUND THEN
            INSERT INTO public.lesson_ai_index (lesson_id, subject, course, topic, title, content)
            VALUES (NEW.id, v_subject, v_course, v_topic, NEW.title, NEW.content);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_lesson_ai_index ON public.course_lessons;
CREATE TRIGGER trigger_sync_lesson_ai_index
AFTER INSERT OR UPDATE OF title, content, module_id
ON public.course_lessons
FOR EACH ROW
EXECUTE FUNCTION sync_lesson_ai_index();

-- Also handle deletion
CREATE OR REPLACE FUNCTION delete_lesson_ai_index()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.lesson_ai_index WHERE lesson_id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_delete_lesson_ai_index ON public.course_lessons;
CREATE TRIGGER trigger_delete_lesson_ai_index
AFTER DELETE ON public.course_lessons
FOR EACH ROW
EXECUTE FUNCTION delete_lesson_ai_index();

-- Backfill existing data
INSERT INTO public.lesson_ai_index (lesson_id, subject, course, topic, title, content)
SELECT 
    cl.id as lesson_id, 
    c.department as subject,
    c.title as course, 
    cm.title as topic, 
    cl.title, 
    cl.content
FROM public.course_lessons cl
LEFT JOIN public.course_modules cm ON cl.module_id = cm.id
LEFT JOIN public.courses c ON cm.course_id = c.id
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION search_lessons(search_query text)
RETURNS TABLE (
  lesson_id uuid,
  subject text,
  course text,
  topic text,
  title text,
  content text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.lesson_id, l.subject, l.course, l.topic, l.title, l.content
  FROM lesson_ai_index l
  WHERE 
    l.title ILIKE '%' || search_query || '%' OR 
    l.content ILIKE '%' || search_query || '%' OR 
    l.topic ILIKE '%' || search_query || '%'
  LIMIT 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE OR REPLACE FUNCTION search_lessons_fts(search_query text)
RETURNS TABLE (
  lesson_id uuid,
  subject text,
  course text,
  topic text,
  title text,
  content text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.lesson_id, l.subject, l.course, l.topic, l.title, l.content
  FROM lesson_ai_index l
  WHERE 
    to_tsvector('english', coalesce(l.title,'') || ' ' || coalesce(l.content,'') || ' ' || coalesce(l.topic,'') || ' ' || coalesce(l.subject,'') || ' ' || coalesce(l.course,'')) @@ plainto_tsquery('english', search_query)
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Function to handle indexing on insert/update of materials
CREATE OR REPLACE FUNCTION sync_material_ai_index()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.lesson_ai_index (lesson_id, subject, course, topic, title, content)
        VALUES (NEW.id, NEW.subject, NEW.course_code, NEW.topic, NEW.title, NEW.description);
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE public.lesson_ai_index 
        SET 
            subject = NEW.subject,
            course = NEW.course_code,
            topic = NEW.topic,
            title = NEW.title, 
            content = NEW.description,
            updated_at = now()
        WHERE lesson_id = NEW.id;
        
        IF NOT FOUND THEN
            INSERT INTO public.lesson_ai_index (lesson_id, subject, course, topic, title, content)
            VALUES (NEW.id, NEW.subject, NEW.course_code, NEW.topic, NEW.title, NEW.description);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_material_ai_index ON public.materials;
CREATE TRIGGER trigger_sync_material_ai_index
AFTER INSERT OR UPDATE OF title, description, subject, course_code, topic
ON public.materials
FOR EACH ROW
EXECUTE FUNCTION sync_material_ai_index();

-- Also handle deletion
CREATE OR REPLACE FUNCTION delete_material_ai_index()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.lesson_ai_index WHERE lesson_id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_delete_material_ai_index ON public.materials;
CREATE TRIGGER trigger_delete_material_ai_index
AFTER DELETE ON public.materials
FOR EACH ROW
EXECUTE FUNCTION delete_material_ai_index();

-- Backfill existing data
INSERT INTO public.lesson_ai_index (lesson_id, subject, course, topic, title, content)
SELECT 
    id as lesson_id, 
    subject,
    course_code as course, 
    topic, 
    title, 
    description as content
FROM public.materials
ON CONFLICT DO NOTHING;
