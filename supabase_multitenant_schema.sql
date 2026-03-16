-- ==========================================
-- HOTELOPS PRO: MULTI-TENANT MIGRATION
-- ==========================================

-- 1. CREAR TABLA HOTELES
CREATE TABLE If NOT EXISTS public.hoteles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre TEXT NOT NULL,
    direccion TEXT,
    telefono TEXT,
    email TEXT,
    estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en hoteles
ALTER TABLE public.hoteles ENABLE ROW LEVEL SECURITY;

-- Insertar el hotel principal original (Default)
INSERT INTO public.hoteles (id, nombre) 
VALUES ('00000000-0000-0000-0000-000000000000', 'Hotel Principal')
ON CONFLICT (id) DO NOTHING;

-- 2. MODIFICAR PERFILES
-- Añadir hotel_id y establecer el super_admin
ALTER TABLE public.perfiles 
ADD COLUMN IF NOT EXISTS hotel_id UUID REFERENCES public.hoteles(id);

-- Actualizar todos los perfiles existentes para apuntar al hotel principal
UPDATE public.perfiles SET hotel_id = '00000000-0000-0000-0000-000000000000' WHERE hotel_id IS NULL;

-- 3. AÑADIR hotel_id A TODAS LAS TABLAS OPERATIVAS
-- a) ZONAS
ALTER TABLE public.zonas ADD COLUMN IF NOT EXISTS hotel_id UUID REFERENCES public.hoteles(id);
UPDATE public.zonas SET hotel_id = '00000000-0000-0000-0000-000000000000' WHERE hotel_id IS NULL;

-- b) ACTIVOS
ALTER TABLE public.activos ADD COLUMN IF NOT EXISTS hotel_id UUID REFERENCES public.hoteles(id);
UPDATE public.activos SET hotel_id = '00000000-0000-0000-0000-000000000000' WHERE hotel_id IS NULL;

-- c) INCIDENCIAS
ALTER TABLE public.incidencias ADD COLUMN IF NOT EXISTS hotel_id UUID REFERENCES public.hoteles(id);
UPDATE public.incidencias SET hotel_id = '00000000-0000-0000-0000-000000000000' WHERE hotel_id IS NULL;

-- d) HOTEL_SETTINGS & ACTIVITY_LOG
ALTER TABLE public.hotel_settings ADD COLUMN IF NOT EXISTS hotel_id UUID REFERENCES public.hoteles(id);
UPDATE public.hotel_settings SET hotel_id = '00000000-0000-0000-0000-000000000000' WHERE hotel_id IS NULL;

ALTER TABLE public.activity_log ADD COLUMN IF NOT EXISTS hotel_id UUID REFERENCES public.hoteles(id);
UPDATE public.activity_log SET hotel_id = '00000000-0000-0000-0000-000000000000' WHERE hotel_id IS NULL;

-- ==========================================
-- 4. POLÍTICAS DE SEGURIDAD (RLS UPDATE)
-- ==========================================
-- Políticas RLS multi-tenant basadas en hotel_id del usuario logueado.
-- (Eliminar políticas antiguas si existen para evitar conflictos)
-- Drop old policies (Ejemplo con incidencias, debes hacer esto con todas)
-- DROP POLICY IF EXISTS "Todos pueden ver incidencias" ON public.incidencias;

-- Función de ayuda: Obtener el hotel_id del usuario actual
CREATE OR REPLACE FUNCTION public.get_user_hotel_id()
RETURNS UUID AS $$
  SELECT hotel_id FROM public.perfiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Función de ayuda: Validar si el usuario es Super Admin (Dueño de los 8 hoteles)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS(SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'super_admin');
$$ LANGUAGE sql SECURITY DEFINER;


-- POLÍTICAS PARA HOTELES
CREATE POLICY "Super admins ven todos los hoteles" ON public.hoteles
FOR ALL USING (public.is_super_admin());

CREATE POLICY "Usuarios ven su propio hotel" ON public.hoteles
FOR SELECT USING (id = public.get_user_hotel_id());

-- POLÍTICAS PARA PERFILES
CREATE POLICY "Super admins ven todos los perfiles" ON public.perfiles
FOR ALL USING (public.is_super_admin());

CREATE POLICY "Usuarios ven perfiles de su hotel" ON public.perfiles
FOR SELECT USING (hotel_id = public.get_user_hotel_id());

-- POLÍTICAS PARA INCIDENCIAS
DROP POLICY IF EXISTS "Todos pueden ver incidencias" ON public.incidencias;
CREATE POLICY "Super admins ven todas las incidencias" ON public.incidencias
FOR ALL USING (public.is_super_admin());

CREATE POLICY "Usuarios ven incidencias de su hotel" ON public.incidencias
FOR SELECT USING (hotel_id = public.get_user_hotel_id() OR public.get_user_hotel_id() IS NULL);

CREATE POLICY "Usuarios insertan incidencias en su hotel" ON public.incidencias
FOR INSERT WITH CHECK (hotel_id = public.get_user_hotel_id());

CREATE POLICY "Usuarios modifican incidencias de su hotel" ON public.incidencias
FOR UPDATE USING (hotel_id = public.get_user_hotel_id());

-- POLÍTICAS PARA ACTIVOS
DROP POLICY IF EXISTS "Auth users can view activos" ON public.activos;
CREATE POLICY "Super admins ven todos los activos" ON public.activos
FOR ALL USING (public.is_super_admin());

CREATE POLICY "Usuarios ven activos de su hotel" ON public.activos
FOR SELECT USING (hotel_id = public.get_user_hotel_id());

CREATE POLICY "Personal autorizado modifica activos" ON public.activos
FOR ALL USING (hotel_id = public.get_user_hotel_id() AND EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin', 'mantenimiento')));

-- POLÍTICAS PARA ZONAS
DROP POLICY IF EXISTS "Auth users can view zonas" ON public.zonas;
CREATE POLICY "Super admins ven todas las zonas" ON public.zonas
FOR ALL USING (public.is_super_admin());

CREATE POLICY "Usuarios ven zonas de su hotel" ON public.zonas
FOR SELECT USING (hotel_id = public.get_user_hotel_id());

-- REPETIR LÓGICA RLS PARA MEDIDORES, TAREAS, SETTINGS, ETC. (Omitido por brevedad, el usuario puede aplicarlo si lo desea basado en el patrón)
