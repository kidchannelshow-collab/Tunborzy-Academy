-- Fix CBT RLS policies to enforce ownership
DROP POLICY IF EXISTS "Staff can manage exams" ON public.cbt_exams;

CREATE POLICY "Admin can manage all exams" ON public.cbt_exams FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'
  )
);

CREATE POLICY "Lecturer can manage their own exams" ON public.cbt_exams FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'Lecturer'
  )
  AND created_by = auth.uid()
);

-- Similarly for questions, though questions don't have created_by, they belong to exams
DROP POLICY IF EXISTS "Staff can manage questions" ON public.cbt_questions;

CREATE POLICY "Admin can manage all questions" ON public.cbt_questions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'
  )
);

CREATE POLICY "Lecturer can manage their own exam questions" ON public.cbt_questions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.cbt_exams
    WHERE cbt_exams.id = cbt_questions.exam_id AND cbt_exams.created_by = auth.uid()
  )
);
