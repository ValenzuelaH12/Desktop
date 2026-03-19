-- MANTENIMIENTO PREVENTIVO RELOADED (Checklists con Frecuencias)

-- 0. Limpieza de tablas experimentales previas
DROP TABLE IF EXISTS public.preventivo_detalles CASCADE;
DROP TABLE IF EXISTS public.preventivo_inspecciones CASCADE;
DROP TABLE IF EXISTS public.mantenimiento_filtros CASCADE;

-- 1. Tipos y Enums
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'frecuencia_mantenimiento') THEN
        CREATE TYPE frecuencia_mantenimiento AS ENUM ('diaria', 'semanal', 'quincenal', 'mensual', 'trimestral', 'semestral', 'anual');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_item_checklist') THEN
        CREATE TYPE estado_item_checklist AS ENUM ('ok', 'aviso', 'grave');
    END IF;
END $$;

-- 2. Planes Maestros (Definición de qué y cada cuánto)
CREATE TABLE IF NOT EXISTS public.mantenimiento_planes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    hotel_id uuid REFERENCES public.hoteles(id) ON DELETE CASCADE,
    nombre text NOT NULL,
    frecuencia frecuencia_mantenimiento NOT NULL,
    items_base jsonb NOT NULL DEFAULT '["Cama", "TV", "Mesa", "Teléfono", "Armario", "Filtros AC"]',
    activo boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- 3. Tareas Generadas (Instancias de ejecución)
CREATE TABLE IF NOT EXISTS public.mantenimiento_tareas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    hotel_id uuid REFERENCES public.hoteles(id) ON DELETE CASCADE,
    plan_id uuid REFERENCES public.mantenimiento_planes(id) ON DELETE CASCADE,
    habitacion_id uuid REFERENCES public.habitaciones(id) ON DELETE CASCADE,
    estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'completada', 'cancelada')),
    fecha_programada date NOT NULL,
    completada_en timestamptz,
    usuario_id uuid REFERENCES auth.users(id),
    comentarios text
);

-- 4. Resultados de cada Item del Checklist
CREATE TABLE IF NOT EXISTS public.mantenimiento_items_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tarea_id uuid REFERENCES public.mantenimiento_tareas(id) ON DELETE CASCADE,
    nombre_item text NOT NULL,
    estado estado_item_checklist DEFAULT 'ok',
    observacion text,
    es_manual boolean DEFAULT false -- Para distinguir si era del plan o añadido en el momento
);

-- RLS
ALTER TABLE public.mantenimiento_planes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mantenimiento_tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mantenimiento_items_log ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Hotel access for planes" ON public.mantenimiento_planes FOR ALL USING (hotel_id IN (SELECT hotel_id FROM public.perfiles WHERE id = auth.uid()));
CREATE POLICY "Hotel access for tareas" ON public.mantenimiento_tareas FOR ALL USING (hotel_id IN (SELECT hotel_id FROM public.perfiles WHERE id = auth.uid()));
CREATE POLICY "Access for items_log" ON public.mantenimiento_items_log FOR ALL USING (
    tarea_id IN (SELECT id FROM public.mantenimiento_tareas WHERE hotel_id IN (SELECT hotel_id FROM public.perfiles WHERE id = auth.uid()))
);
