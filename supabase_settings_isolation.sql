-- ==========================================
-- HOTELOPS PRO: SETTINGS ISOLATION (MULTI-TENANT)
-- ==========================================

-- 1. FIX hotel_settings TABLE
ALTER TABLE public.hotel_settings ADD COLUMN IF NOT EXISTS hotel_id UUID REFERENCES public.hoteles(id);

-- Change primary key to be composite (key, hotel_id)
-- Note: This might require dropping the existing PK first.
DO $$ 
BEGIN
    ALTER TABLE public.hotel_settings DROP CONSTRAINT hotel_settings_pkey;
EXCEPTION WHEN undefined_object THEN
    NULL;
END $$;

ALTER TABLE public.hotel_settings ADD PRIMARY KEY (key, hotel_id);

-- 2. FIX activity_log TABLE
ALTER TABLE public.activity_log ADD COLUMN IF NOT EXISTS hotel_id UUID REFERENCES public.hoteles(id);

-- 3. ASSIGN EXISTING DATA TO DEFAULT HOTEL
UPDATE public.hotel_settings SET hotel_id = '00000000-0000-0000-0000-000000000000' WHERE hotel_id IS NULL;
UPDATE public.activity_log SET hotel_id = '00000000-0000-0000-0000-000000000000' WHERE hotel_id IS NULL;

-- 4. APPLY RLS POLICIES FOR SETTINGS
DROP POLICY IF EXISTS "Permitir lectura de hotel_settings a todos" ON public.hotel_settings;
DROP POLICY IF EXISTS "Permitir actualizaciones de hotel_settings autenticados" ON public.hotel_settings;

CREATE POLICY "RLS_MultiHotel_Settings_Select" ON public.hotel_settings
  FOR SELECT USING (public.is_super_admin() OR hotel_id = public.get_user_hotel_id());

CREATE POLICY "RLS_MultiHotel_Settings_All" ON public.hotel_settings
  FOR ALL USING (public.is_super_admin() OR hotel_id = public.get_user_hotel_id());

-- 5. APPLY RLS POLICIES FOR ACTIVITY LOG
DROP POLICY IF EXISTS "Permitir select a activity_log para autenticados" ON public.activity_log;
DROP POLICY IF EXISTS "Permitir insert a activity_log para autenticados" ON public.activity_log;

CREATE POLICY "RLS_MultiHotel_ActivityLog_Select" ON public.activity_log
  FOR SELECT USING (public.is_super_admin() OR hotel_id = public.get_user_hotel_id());

CREATE POLICY "RLS_MultiHotel_ActivityLog_Insert" ON public.activity_log
  FOR INSERT WITH CHECK (public.is_super_admin() OR hotel_id = public.get_user_hotel_id());
