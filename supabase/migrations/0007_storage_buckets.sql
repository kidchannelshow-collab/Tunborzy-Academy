INSERT INTO storage.buckets (id, name, public) VALUES ('course_materials', 'course_materials', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('assignments', 'assignments', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access Materials" ON storage.objects FOR SELECT USING (bucket_id = 'course_materials');
CREATE POLICY "Auth Upload Materials" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'course_materials' AND auth.role() = 'authenticated');
CREATE POLICY "Auth Update Materials" ON storage.objects FOR UPDATE WITH CHECK (bucket_id = 'course_materials' AND auth.role() = 'authenticated');
CREATE POLICY "Auth Delete Materials" ON storage.objects FOR DELETE USING (bucket_id = 'course_materials' AND auth.role() = 'authenticated');

CREATE POLICY "Lecturer Access Assignments" ON storage.objects FOR SELECT USING (bucket_id = 'assignments' AND auth.role() = 'authenticated');
CREATE POLICY "Auth Upload Assignments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'assignments' AND auth.role() = 'authenticated');
