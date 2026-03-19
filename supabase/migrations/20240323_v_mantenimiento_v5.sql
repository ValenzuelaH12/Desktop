-- MANTENIMIENTO PREVENTIVO JERÁRQUICO (V5) - STANDALONE
-- Crea toda la infraestructura necesaria para planes con alcance jerárquico manual.

-- 1. Tipos y Enums
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'frecuencia_mantenimiento') THEN
        CREATE TYPE frecuencia_mantenimiento AS ENUM ('diaria', 'semanal', 'quincenal', 'mensual', 'trimestral', 'semestral', 'anual');
    END IF;
END $$;

-- 2. Tabla de Planes Maestros
CREATE TABLE IF NOT EXISTS public.mantenimiento_planes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    hotel_id uuid REFERENCES public.hoteles(id) ON DELETE CASCADE,
    nombre text NOT NULL,
    frecuencia frecuencia_mantenimiento NOT NULL,
    items_base jsonb NOT NULL DEFAULT '[]',
    scope jsonb NOT NULL DEFAULT '[]', -- Estructura: [{ "zona": string, "espacios": string[] }]
    activo boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- RLS para Planes
ALTER TABLE public.mantenimiento_planes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Hotel access for planes_v5" ON public.mantenimiento_planes;
CREATE POLICY "Hotel access for planes_v5" ON public.mantenimiento_planes 
FOR ALL USING (hotel_id IN (SELECT hotel_id FROM public.perfiles WHERE id = auth.uid()));

-- 3. Tabla de Tareas Ejecutables
CREATE TABLE IF NOT EXISTS public.mantenimiento_tareas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    hotel_id uuid REFERENCES public.hoteles(id) ON DELETE CASCADE,
    plan_id uuid REFERENCES public.mantenimiento_planes(id) ON DELETE CASCADE,
    
    zona_nombre text,
    espacio_nombre text,
    habitacion_id uuid REFERENCES public.habitaciones(id) ON DELETE SET NULL,
    
    estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'completada', 'cancelada')),
    fecha_programada date NOT NULL,
    completada_en timestamptz,
    usuario_id uuid REFERENCES auth.users(id),
    comentarios text,
    created_at timestamptz DEFAULT now()
);

-- RLS para Tareas
ALTER TABLE public.mantenimiento_tareas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Hotel access for tareas_v5" ON public.mantenimiento_tareas;
CREATE POLICY "Hotel access for tareas_v5" ON public.mantenimiento_tareas 
FOR ALL USING (hotel_id IN (SELECT hotel_id FROM public.perfiles WHERE id = auth.uid()));

-- 4. Tabla de Logs de Items (Resultados del Checklist)
CREATE TABLE IF NOT EXISTS public.mantenimiento_items_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tarea_id uuid REFERENCES public.mantenimiento_tareas(id) ON DELETE CASCADE,
    nombre_item text NOT NULL,
    estado text DEFAULT 'ok', -- ok, aviso, grave
    observacion text,
    es_manual boolean DEFAULT false
);

-- RLS para Logs
ALTER TABLE public.mantenimiento_items_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Access for items_log_v5" ON public.mantenimiento_items_log;
CREATE POLICY "Access for items_log_v5" ON public.mantenimiento_items_log FOR ALL USING (
    tarea_id IN (SELECT id FROM public.mantenimiento_tareas WHERE hotel_id IN (SELECT hotel_id FROM public.perfiles WHERE id = auth.uid()))
);
