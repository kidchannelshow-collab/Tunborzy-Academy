CREATE TABLE IF NOT EXISTS public.admin_access_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    access_code_sha256 TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.admin_access_codes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.lecturer_access_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    access_code_sha256 TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.lecturer_access_codes ENABLE ROW LEVEL SECURITY;

-- Seed Development Codes (Do not overwrite if exist)
INSERT INTO public.admin_access_codes (access_code_sha256, is_active)
VALUES ('174ab8da921f61e62ba74d379129aa498b400721deed1fd9991be938bede02e7', true)
ON CONFLICT (access_code_sha256) DO NOTHING;

INSERT INTO public.lecturer_access_codes (access_code_sha256, is_active)
VALUES ('242fb03053ba5c5f04d233634990cbb776f58c201374a3f7909b715ea3bcdeaa', true)
ON CONFLICT (access_code_sha256) DO NOTHING;
