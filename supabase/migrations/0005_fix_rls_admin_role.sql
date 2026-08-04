-- Drop broken policies
DROP POLICY IF EXISTS "Lecturers manage own courses" ON public.courses;
DROP POLICY IF EXISTS "Lecturers manage own modules" ON public.course_modules;
DROP POLICY IF EXISTS "Lecturers manage own lessons" ON public.course_lessons;
DROP POLICY IF EXISTS "Lecturers manage own live classes" ON public.live_classes;
DROP POLICY IF EXISTS "Lecturers manage own assignments" ON public.assignments;
DROP POLICY IF EXISTS "Lecturers read/grade course submissions" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Lecturers manage own announcements" ON public.announcements;

-- Create correct policies
CREATE POLICY "Lecturers and Admins manage courses" ON public.courses FOR ALL USING (
  lecturer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'admin'))
);

CREATE POLICY "Lecturers and Admins manage modules" ON public.course_modules FOR ALL USING (
  EXISTS (SELECT 1 FROM public.courses WHERE id = course_modules.course_id AND lecturer_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'admin'))
);

CREATE POLICY "Lecturers and Admins manage lessons" ON public.course_lessons FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.course_modules cm
    JOIN public.courses c ON c.id = cm.course_id
    WHERE cm.id = course_lessons.module_id AND c.lecturer_id = auth.uid()
  ) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'admin'))
);

CREATE POLICY "Lecturers and Admins manage live classes" ON public.live_classes FOR ALL USING (
  lecturer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'admin'))
);

CREATE POLICY "Lecturers and Admins manage assignments" ON public.assignments FOR ALL USING (
  lecturer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'admin'))
);

CREATE POLICY "Lecturers and Admins manage course submissions" ON public.assignment_submissions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.assignments WHERE id = assignment_submissions.assignment_id AND lecturer_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'admin'))
);

CREATE POLICY "Lecturers and Admins manage announcements" ON public.announcements FOR ALL USING (
  lecturer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'admin'))
);

DROP POLICY IF EXISTS "Admin full access materials" ON public.materials;
CREATE POLICY "Admin and Lecturer full access materials" ON public.materials
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'admin', 'Lecturer', 'lecturer'))
  );
