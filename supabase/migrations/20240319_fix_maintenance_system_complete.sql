-- SCRIPT DE REPARACIÓN INTEGRAL: SISTEMA DE MANTENIMIENTO
-- Este script asegura que todas las tablas, columnas y políticas existan en el orden correcto.

-- 0. EXTENSIONES (Necesarias para generar IDs únicos)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABLA DE HOTELES (Base para multi-tenant)
CREATE TABLE IF NOT EXISTS public.hoteles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- 2. ASEGURAR COLUMNAS EN MANTENIMIENTO PREVENTIVO
ALTER TABLE public.mantenimiento_preventivo ADD COLUMN IF NOT EXISTS hotel_id uuid REFERENCES public.hoteles(id);
ALTER TABLE public.mantenimiento_preventivo ADD COLUMN IF NOT EXISTS checklist_items text[] DEFAULT '{}';
ALTER TABLE public.mantenimiento_preventivo ADD COLUMN IF NOT EXISTS categoria text;
ALTER TABLE public.mantenimiento_preventivo ADD COLUMN IF NOT EXISTS subcategoria text;

-- 3. TABLA DE EJECUCIONES (Work Orders)
CREATE TABLE IF NOT EXISTS public.mantenimiento_ejecucion (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tarea_id uuid REFERENCES public.mantenimiento_preventivo(id) ON DELETE CASCADE,
    hotel_id uuid REFERENCES public.hoteles(id),
    tecnico_id uuid REFERENCES public.perfiles(id),
    estado text NOT NULL DEFAULT 'in_progress' CHECK (estado IN ('in_progress', 'completed', 'cancelled')),
    iniciado_at timestamp with time zone DEFAULT now(),
    completado_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- 4. TABLA DE ENTIDADES (Revisiones por Habitación/Activo)
CREATE TABLE IF NOT EXISTS public.mantenimiento_entidades (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ejecucion_id uuid REFERENCES public.mantenimiento_ejecucion(id) ON DELETE CASCADE,
    entidad_id uuid,
    entidad_nombre text NOT NULL,
    entidad_tipo text NOT NULL DEFAULT 'habitacion',
    estado text NOT NULL DEFAULT 'pending' CHECK (estado IN ('pending', 'ok', 'issue', 'repair_scheduled')),
    checklist_resultados jsonb DEFAULT '[]'::jsonb,
    comentarios text,
    media_urls text ARRAY DEFAULT ARRAY[]::text[],
    hotel_id uuid REFERENCES public.hoteles(id),
    created_at timestamp with time zone DEFAULT now()
);

-- 5. HABILITAR SEGURIDAD (RLS)
ALTER TABLE public.mantenimiento_ejecucion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mantenimiento_entidades ENABLE ROW LEVEL SECURITY;

-- 6. POLÍTICAS DE SEGURIDAD (Limpiar y Re-crear)
-- Ejecuciones
DROP POLICY IF EXISTS "Ejecuciones visibles por hotel" ON public.mantenimiento_ejecucion;
CREATE POLICY "Ejecuciones visibles por hotel" ON public.mantenimiento_ejecucion
FOR SELECT TO authenticated 
USING (hotel_id = (SELECT hotel_id FROM public.perfiles WHERE id = auth.uid()) OR EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'super_admin'));

DROP POLICY IF EXISTS "Gestión de ejecuciones" ON public.mantenimiento_ejecucion;
CREATE POLICY "Gestión de ejecuciones" ON public.mantenimiento_ejecucion
FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND (rol IN ('admin', 'super_admin', 'mantenimiento'))));

-- Entidades
DROP POLICY IF EXISTS "Entidades visibles por hotel" ON public.mantenimiento_entidades;
CREATE POLICY "Entidades visibles por hotel" ON public.mantenimiento_entidades
FOR SELECT TO authenticated 
USING (hotel_id = (SELECT hotel_id FROM public.perfiles WHERE id = auth.uid()) OR EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'super_admin'));

DROP POLICY IF EXISTS "Gestión de entidades" ON public.mantenimiento_entidades;
CREATE POLICY "Gestión de entidades" ON public.mantenimiento_entidades
FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND (rol IN ('admin', 'super_admin', 'mantenimiento'))));

-- 7. COMENTARIOS (Opcional, para documentación)
COMMENT ON TABLE public.mantenimiento_ejecucion IS 'Registro de sesiones de mantenimiento iniciadas por técnicos';
COMMENT ON TABLE public.mantenimiento_entidades IS 'Registro de revisiones individuales por habitación dentro de una sesión';
