-- UTME CBT Subject Structure Seeding & Verification (Phase 1.12.1)
-- Ensures the five mandatory UTME subjects exist with proper codes and metadata.

INSERT INTO public.utme_subjects (name, code, description, is_active) VALUES
('English Language', 'ENG', 'Compulsory use of English language test for UTME candidates.', true),
('Mathematics', 'MTH', 'General Mathematics and quantitative reasoning.', true),
('Physics', 'PHY', 'Fundamental physics principles, mechanics, and electricity.', true),
('Chemistry', 'CHM', 'Organic, inorganic, and physical chemistry.', true),
('Biology', 'BIO', 'General biology, ecology, and human anatomy.', true)
ON CONFLICT (name) DO UPDATE SET 
    code = EXCLUDED.code,
    description = EXCLUDED.description,
    is_active = true;

-- Ensure RLS is enabled
ALTER TABLE public.utme_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utme_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utme_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utme_attempts ENABLE ROW LEVEL SECURITY;
