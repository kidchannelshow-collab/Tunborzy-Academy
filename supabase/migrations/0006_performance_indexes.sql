-- CBT Tables Indexes
CREATE INDEX IF NOT EXISTS idx_cbt_questions_exam_id ON public.cbt_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_cbt_attempts_exam_id ON public.cbt_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_cbt_attempts_user_id ON public.cbt_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_cbt_answers_attempt_id ON public.cbt_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_cbt_answers_question_id ON public.cbt_answers(question_id);

-- Notifications Index
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- Course Tables Indexes
CREATE INDEX IF NOT EXISTS idx_courses_lecturer_id ON public.courses(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_course_modules_course_id ON public.course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_module_id ON public.course_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_live_classes_course_id ON public.live_classes(course_id);
CREATE INDEX IF NOT EXISTS idx_live_classes_lecturer_id ON public.live_classes(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON public.assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_lecturer_id ON public.assignments(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_id ON public.assignment_submissions(student_id);

-- Announcements Index
CREATE INDEX IF NOT EXISTS idx_announcements_lecturer_id ON public.announcements(lecturer_id);

-- Material Indexes
CREATE INDEX IF NOT EXISTS idx_materials_course_id ON public.materials(course_id);
CREATE INDEX IF NOT EXISTS idx_material_downloads_material_id ON public.material_downloads(material_id);
CREATE INDEX IF NOT EXISTS idx_material_downloads_user_id ON public.material_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_materials_material_id ON public.saved_materials(material_id);
CREATE INDEX IF NOT EXISTS idx_saved_materials_user_id ON public.saved_materials(user_id);
CREATE INDEX IF NOT EXISTS idx_material_notes_material_id ON public.material_notes(material_id);
CREATE INDEX IF NOT EXISTS idx_material_notes_user_id ON public.material_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_material_progress_material_id ON public.material_progress(material_id);
CREATE INDEX IF NOT EXISTS idx_material_progress_user_id ON public.material_progress(user_id);

-- Chat System Indexes
CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_by ON public.chat_rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_chat_members_room_id ON public.chat_members(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_user_id ON public.chat_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON public.chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pinned_messages_room_id ON public.pinned_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_message_id ON public.message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_user_id ON public.message_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON public.message_reactions(message_id);
