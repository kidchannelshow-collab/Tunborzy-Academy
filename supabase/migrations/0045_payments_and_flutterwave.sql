-- ============================================================================
-- PHASE 2.3 — PAYMENTS & FLUTTERWAVE VERIFICATION MIGRATION (0045)
-- Creates payments table for idempotency and verified premium tracking.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    reference TEXT NOT NULL UNIQUE,
    transaction_id TEXT,
    amount NUMERIC(12,2) NOT NULL,
    currency TEXT DEFAULT 'NGN',
    status TEXT DEFAULT 'successful',
    provider TEXT DEFAULT 'flutterwave',
    plan TEXT DEFAULT 'premium',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance and idempotency
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON public.payments(reference);

-- Enable RLS on payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins have full access to payments" ON public.payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'
        )
    );
