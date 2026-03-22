-- ==========================================
-- V-SUITE: SCHEMA PARA SUSCRIPCIONES (STRIPE)
-- ==========================================

-- 1. Ampliar tabla de hoteles con info de Stripe
ALTER TABLE public.hoteles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- 2. Asegurar que los campos de estado existen (por si acaso)
ALTER TABLE public.hoteles 
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trialing';

-- 3. Tabla de Logs de Suscripción / Facturación
CREATE TABLE IF NOT EXISTS public.suscripciones_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID REFERENCES public.hoteles(id) ON DELETE CASCADE,
    stripe_session_id TEXT,
    amount NUMERIC,
    currency TEXT DEFAULT 'EUR',
    status TEXT, -- 'completed', 'failed', 'pending'
    plan_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. RLS para logs (Solo admins del hotel y super_admin)
ALTER TABLE public.suscripciones_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins ven sus propios logs" ON public.suscripciones_log;
CREATE POLICY "Admins ven sus propios logs" ON public.suscripciones_log
FOR SELECT USING (
    auth.uid() IN (
        SELECT id FROM public.perfiles 
        WHERE hotel_id = suscripciones_log.hotel_id 
        AND rol IN ('admin', 'direccion', 'super_admin', 'chain_manager')
    )
);

DROP POLICY IF EXISTS "Super admins ven todos los logs" ON public.suscripciones_log;
CREATE POLICY "Super admins ven todos los logs" ON public.suscripciones_log
FOR ALL USING (public.is_super_admin());
