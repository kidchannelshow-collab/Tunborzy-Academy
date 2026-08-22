-- 0047_platform_settings.sql
-- Platform settings table for admin configuration

CREATE TABLE IF NOT EXISTS public.platform_settings (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL UNIQUE,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Admins can manage platform settings
CREATE POLICY "Admins can manage platform settings"
ON public.platform_settings
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'
    )
);

-- Anyone authenticated can read platform settings (or public if needed for UI configuration)
CREATE POLICY "Authenticated users can read platform settings"
ON public.platform_settings
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Seed default settings if empty
INSERT INTO public.platform_settings (category, settings)
VALUES 
('general', '{"platform_name": "Tunborzy Academy", "platform_description": "Excellence in Academic and CBT Preparation", "support_email": "support@tunborzy.edu.ng", "contact_phone": "+234 800 000 0000"}'::jsonb),
('academic', '{"undergraduate_levels": ["100L", "200L", "300L", "400L", "500L"], "current_academic_session": "2025/2026", "current_semester": "First Semester", "course_material_config": "Standard"}'::jsonb),
('cbt', '{"undergraduate_cbt_enabled": true, "utme_cbt_enabled": true, "post_utme_cbt_enabled": true, "default_exam_duration_mins": 30, "default_question_count": 40}'::jsonb),
('premium', '{"premium_system_enabled": true, "premium_access_config": "Full Access", "subscription_config": "Monthly / Yearly"}'::jsonb),
('partnership', '{"referral_system_enabled": true, "commission_percentage": 20.0, "default_referral_config": "Standard 20% Commission"}'::jsonb),
('notification', '{"notifications_enabled": true, "system_notification_config": "Real-time Push & In-App", "notification_behavior": "Instant"}'::jsonb)
ON CONFLICT (category) DO NOTHING;
