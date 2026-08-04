-- Deactivate all previous development codes
UPDATE public.admin_access_codes SET is_active = false;

-- Insert the new Admin Access Code (Tunborzyacademy@unilorin)
INSERT INTO public.admin_access_codes (access_code_sha256, is_active)
VALUES ('174ab8da921f61e62ba74d379129aa498b400721deed1fd9991be938bede02e7', true)
ON CONFLICT (access_code_sha256) DO UPDATE SET is_active = true, used_at = NULL, expires_at = NULL;
