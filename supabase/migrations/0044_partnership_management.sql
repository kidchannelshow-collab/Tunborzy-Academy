-- ============================================================================
-- PHASE 2.1 — PARTNERSHIP MANAGEMENT MIGRATION (0044)
-- Creates partners table, adds referred_by_partner_id to profiles, and sets RLS.
-- ============================================================================

-- 1. Create partners table
CREATE TABLE IF NOT EXISTS public.partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    referral_code TEXT NOT NULL UNIQUE,
    commission_percentage NUMERIC(5,2) DEFAULT 20.00,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add referred_by_partner_id to profiles table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'referred_by_partner_id'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN referred_by_partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_partners_referral_code ON public.partners(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by_partner ON public.profiles(referred_by_partner_id);

-- 4. Enable RLS on partners
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for partners
-- Admins can do everything on partners
CREATE POLICY "Admins have full access to partners" ON public.partners
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'
        )
    );

-- Anyone authenticated or anon can read partner referral codes for signup validation
CREATE POLICY "Public and authenticated can read partner referral codes" ON public.partners
    FOR SELECT USING (true);
