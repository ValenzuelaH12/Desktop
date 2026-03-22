-- ==========================================
-- HOTELOPS PRO: MULTI-TENANT MIGRATION (PART 2)
-- Adding missing hotel_id to all tables
-- ==========================================

-- 1. ADD hotel_id TO REMAINING TABLES
DO $$ 
BEGIN
    -- habitaciones
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='habitaciones' AND column_name='hotel_id') THEN
        ALTER TABLE public.habitaciones ADD COLUMN hotel_id UUID REFERENCES public.hoteles(id);
    END IF;

    -- contadores
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contadores' AND column_name='hotel_id') THEN
        ALTER TABLE public.contadores ADD COLUMN hotel_id UUID REFERENCES public.hoteles(id);
    END IF;

    -- mantenimiento_preventivo
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mantenimiento_preventivo' AND column_name='hotel_id') THEN
        ALTER TABLE public.mantenimiento_preventivo ADD COLUMN hotel_id UUID REFERENCES public.hoteles(id);
    END IF;

    -- mantenimiento_plantillas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mantenimiento_plantillas' AND column_name='hotel_id') THEN
        ALTER TABLE public.mantenimiento_plantillas ADD COLUMN hotel_id UUID REFERENCES public.hoteles(id);
    END IF;

    -- lecturas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lecturas' AND column_name='hotel_id') THEN
        ALTER TABLE public.lecturas ADD COLUMN hotel_id UUID REFERENCES public.hoteles(id);
    END IF;

    -- controles
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='controles' AND column_name='hotel_id') THEN
        ALTER TABLE public.controles ADD COLUMN hotel_id UUID REFERENCES public.hoteles(id);
    END IF;

    -- mensajes (chat)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mensajes' AND column_name='hotel_id') THEN
        ALTER TABLE public.mensajes ADD COLUMN hotel_id UUID REFERENCES public.hoteles(id);
    END IF;
END $$;

-- 2. UPDATE EXISTING DATA TO DEFAULT HOTEL (Hotel Principal)
-- Only run update if they were null
UPDATE public.habitaciones SET hotel_id = '00000000-0000-0000-0000-000000000000' WHERE hotel_id IS NULL;
UPDATE public.contadores SET hotel_id = '00000000-0000-0000-0000-000000000000' WHERE hotel_id IS NULL;
UPDATE public.mantenimiento_preventivo SET hotel_id = '00000000-0000-0000-0000-000000000000' WHERE hotel_id IS NULL;
UPDATE public.mantenimiento_plantillas SET hotel_id = '00000000-0000-0000-0000-000000000000' WHERE hotel_id IS NULL;
UPDATE public.lecturas SET hotel_id = '00000000-0000-0000-0000-000000000000' WHERE hotel_id IS NULL;
UPDATE public.controles SET hotel_id = '00000000-0000-0000-0000-000000000000' WHERE hotel_id IS NULL;
UPDATE public.mensajes SET hotel_id = '00000000-0000-0000-0000-000000000000' WHERE hotel_id IS NULL;

-- 3. APPLY RLS POLICIES (Pattern for isolation)
-- We will use the existing helper functions public.is_super_admin() and public.get_user_hotel_id()

-- Generic Policy Template for many tables
-- DROP POLICY IF EXISTS ... ON ...;
-- CREATE POLICY ... ON ... FOR ALL USING (public.is_super_admin() OR hotel_id = public.get_user_hotel_id());

-- Contratar policies for better isolation
CREATE POLICY "RLS_MultiHotel_Planificacion" ON public.mantenimiento_preventivo FOR ALL USING (public.is_super_admin() OR hotel_id = public.get_user_hotel_id());
CREATE POLICY "RLS_MultiHotel_Habitaciones" ON public.habitaciones FOR ALL USING (public.is_super_admin() OR hotel_id = public.get_user_hotel_id());
CREATE POLICY "RLS_MultiHotel_Contadores" ON public.contadores FOR ALL USING (public.is_super_admin() OR hotel_id = public.get_user_hotel_id());
CREATE POLICY "RLS_MultiHotel_Lecturas" ON public.lecturas FOR ALL USING (public.is_super_admin() OR hotel_id = public.get_user_hotel_id());
CREATE POLICY "RLS_MultiHotel_Inventario" ON public.inventario FOR ALL USING (public.is_super_admin() OR hotel_id = public.get_user_hotel_id());
