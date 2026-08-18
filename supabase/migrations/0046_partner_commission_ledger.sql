-- ============================================================================
-- PHASE 2.4 — PARTNER COMMISSION LEDGER & PAYOUTS MIGRATION (0046)
-- Creates partner_commission_ledger and partner_payouts tables with strict RLS and uniqueness constraints.
-- ============================================================================

-- 1. Create partner_commission_ledger table
CREATE TABLE IF NOT EXISTS public.partner_commission_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
    referred_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    referral_code TEXT NOT NULL,
    payment_reference TEXT NOT NULL UNIQUE,
    payment_amount NUMERIC(12,2) NOT NULL,
    commission_rate NUMERIC(5,2) DEFAULT 0.20 NOT NULL,
    commission_amount NUMERIC(12,2) NOT NULL,
    currency TEXT DEFAULT 'NGN' NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Create partner_payouts table
CREATE TABLE IF NOT EXISTS public.partner_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    currency TEXT DEFAULT 'NGN' NOT NULL,
    status TEXT DEFAULT 'paid' NOT NULL CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
    payout_reference TEXT NOT NULL UNIQUE,
    requested_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_commission_ledger_partner_id ON public.partner_commission_ledger(partner_id);
CREATE INDEX IF NOT EXISTS idx_commission_ledger_referred_user ON public.partner_commission_ledger(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_commission_ledger_payment_ref ON public.partner_commission_ledger(payment_reference);
CREATE INDEX IF NOT EXISTS idx_commission_ledger_status ON public.partner_commission_ledger(status);
CREATE INDEX IF NOT EXISTS idx_commission_ledger_created ON public.partner_commission_ledger(created_at);

CREATE INDEX IF NOT EXISTS idx_partner_payouts_partner_id ON public.partner_payouts(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_payouts_status ON public.partner_payouts(status);

-- 4. Enable RLS
ALTER TABLE public.partner_commission_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_payouts ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for partner_commission_ledger
-- Admins have full access
CREATE POLICY "Admins have full access to commission ledger" ON public.partner_commission_ledger
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'
        )
    );

-- Partners can view their own commission ledger entries
CREATE POLICY "Partners can view their own commission ledger" ON public.partner_commission_ledger
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.partners 
            WHERE partners.id = partner_commission_ledger.partner_id 
            AND partners.email = (SELECT email FROM public.profiles WHERE id = auth.uid())
        ) OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'
        )
    );

-- 6. RLS Policies for partner_payouts
CREATE POLICY "Admins have full access to partner payouts" ON public.partner_payouts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'
        )
    );

CREATE POLICY "Partners can view their own payouts" ON public.partner_payouts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.partners 
            WHERE partners.id = partner_payouts.partner_id 
            AND partners.email = (SELECT email FROM public.profiles WHERE id = auth.uid())
        ) OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'
        )
    );
