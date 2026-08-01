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
