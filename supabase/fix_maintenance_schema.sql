-- FIX PARA MANTENIMIENTO PREVENTIVO Y PLANTILLAS (V1)

-- 1. Añadir columnas faltantes a mantenimiento_preventivo
ALTER TABLE public.mantenimiento_preventivo ADD COLUMN IF NOT EXISTS hotel_id uuid REFERENCES public.hoteles(id);
ALTER TABLE public.mantenimiento_preventivo ADD COLUMN IF NOT EXISTS plantilla_id uuid REFERENCES public.mantenimiento_plantillas(id);

-- 2. Añadir hotel_id a mantenimiento_plantillas
ALTER TABLE public.mantenimiento_plantillas ADD COLUMN IF NOT EXISTS hotel_id uuid REFERENCES public.hoteles(id);

-- 3. Habilitar RLS y reparar políticas para multi-tenant
ALTER TABLE public.mantenimiento_preventivo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mantenimiento_plantillas ENABLE ROW LEVEL SECURITY;

-- Políticas para mantenimiento_preventivo
DROP POLICY IF EXISTS "Usuarios pueden ver mantenimiento de su hotel" ON public.mantenimiento_preventivo;
CREATE POLICY "Usuarios pueden ver mantenimiento de su hotel" 
ON public.mantenimiento_preventivo FOR SELECT TO authenticated 
USING (
    hotel_id = (SELECT hotel_id FROM public.perfiles WHERE id = auth.uid()) OR 
    EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'super_admin')
);

DROP POLICY IF EXISTS "Managers pueden gestionar mantenimiento de su hotel" ON public.mantenimiento_preventivo;
CREATE POLICY "Managers pueden gestionar mantenimiento de su hotel" 
ON public.mantenimiento_preventivo FOR ALL TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.perfiles 
        WHERE id = auth.uid() 
        AND (
            (rol IN ('admin', 'super_admin', 'direccion', 'mantenimiento') AND hotel_id = public.mantenimiento_preventivo.hotel_id) OR
            (rol = 'super_admin')
        )
    )
);

-- Políticas para mantenimiento_plantillas
DROP POLICY IF EXISTS "Usuarios pueden ver plantillas de su hotel" ON public.mantenimiento_plantillas;
CREATE POLICY "Usuarios pueden ver plantillas de su hotel" 
ON public.mantenimiento_plantillas FOR SELECT TO authenticated 
USING (
    hotel_id = (SELECT hotel_id FROM public.perfiles WHERE id = auth.uid()) OR 
    EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'super_admin')
);

DROP POLICY IF EXISTS "Managers pueden gestionar plantillas de su hotel" ON public.mantenimiento_plantillas;
CREATE POLICY "Managers pueden gestionar plantillas de su hotel" 
ON public.mantenimiento_plantillas FOR ALL TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.perfiles 
        WHERE id = auth.uid() 
        AND (
            (rol IN ('admin', 'super_admin', 'direccion', 'mantenimiento') AND hotel_id = public.mantenimiento_plantillas.hotel_id) OR
            (rol = 'super_admin')
        )
    )
);
