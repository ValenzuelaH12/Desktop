-- HIERARCHICAL MAINTENANCE EXECUTION SYSTEM (V1)
-- Level 1: Tarea (Already exists)
-- Level 2: Ejecución (Work Order Instance)
-- Level 3: Inspección (Room/Asset with Nested Checklist)

-- 1. Table for Maintenance Executions (Work Orders)
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

-- 2. Table for Entity-Level Inspections (Rooms/Assets within an execution)
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

-- 3. Habilitar RLS
ALTER TABLE public.mantenimiento_ejecucion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mantenimiento_entidades ENABLE ROW LEVEL SECURITY;

-- 4. Eliminar políticas antiguas si existen
DROP POLICY IF EXISTS "Ejecuciones visibles por hotel" ON public.mantenimiento_ejecucion;
DROP POLICY IF EXISTS "Gestión de ejecuciones" ON public.mantenimiento_ejecucion;
DROP POLICY IF EXISTS "Entidades visibles por hotel" ON public.mantenimiento_entidades;
DROP POLICY IF EXISTS "Gestión de entidades" ON public.mantenimiento_entidades;

-- 5. Políticas Multi-Tenant
CREATE POLICY "Ejecuciones visibles por hotel" ON public.mantenimiento_ejecucion
FOR SELECT TO authenticated USING (hotel_id = (SELECT hotel_id FROM public.perfiles WHERE id = auth.uid()) OR EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'super_admin'));

CREATE POLICY "Gestión de ejecuciones" ON public.mantenimiento_ejecucion
FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND (rol IN ('admin', 'super_admin', 'mantenimiento'))));

CREATE POLICY "Entidades visibles por hotel" ON public.mantenimiento_entidades
FOR SELECT TO authenticated USING (hotel_id = (SELECT hotel_id FROM public.perfiles WHERE id = auth.uid()) OR EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'super_admin'));

CREATE POLICY "Gestión de entidades" ON public.mantenimiento_entidades
FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND (rol IN ('admin', 'super_admin', 'mantenimiento'))));
