-- MANTENIMIENTO PREVENTIVO (V4)
-- Infraestructura para la definición de planes maestros y checklists recurrentes.

-- 1. Tipos y Enums (Si no existen por el wipe anterior)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'frecuencia_mantenimiento') THEN
        CREATE TYPE frecuencia_mantenimiento AS ENUM ('diaria', 'semanal', 'quincenal', 'mensual', 'trimestral', 'semestral', 'anual');
    END IF;
END $$;

-- 2. Planes Maestros
CREATE TABLE IF NOT EXISTS public.mantenimiento_planes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    hotel_id uuid REFERENCES public.hoteles(id) ON DELETE CASCADE,
    nombre text NOT NULL,
    frecuencia frecuencia_mantenimiento NOT NULL,
    items_base jsonb NOT NULL DEFAULT '[]',
    activo boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.mantenimiento_planes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hotel access for planes_v4" ON public.mantenimiento_planes 
FOR ALL USING (hotel_id IN (SELECT hotel_id FROM public.perfiles WHERE id = auth.uid()));
