-- REPARACIÓN COMPLETA DE ESQUEMA MULTI-TENANT (V3)
-- Ejecuta este script para asegurar que todas las tablas tienen la columna hotel_id y las políticas correctas.

-- 1. ASEGURAR COLUMNAS (Si ya existen, el comando se ignorará)
ALTER TABLE public.inventario ADD COLUMN IF NOT EXISTS hotel_id uuid REFERENCES public.hoteles(id);
ALTER TABLE public.canales ADD COLUMN IF NOT EXISTS hotel_id uuid REFERENCES public.hoteles(id);
ALTER TABLE public.mensajes ADD COLUMN IF NOT EXISTS hotel_id uuid REFERENCES public.hoteles(id);
ALTER TABLE public.historial_mantenimiento ADD COLUMN IF NOT EXISTS hotel_id uuid REFERENCES public.hoteles(id);
ALTER TABLE public.elementos_mantenimiento ADD COLUMN IF NOT EXISTS hotel_id uuid REFERENCES public.hoteles(id);

-- 2. REPARAR POLÍTICAS DE INVENTARIO
DROP POLICY IF EXISTS "Usuarios pueden ver inventario de su hotel" ON public.inventario;
DROP POLICY IF EXISTS "Managers pueden gestionar inventario de su hotel" ON public.inventario;

CREATE POLICY "Usuarios pueden ver inventario de su hotel" 
ON public.inventario FOR SELECT TO authenticated 
USING (
    hotel_id = (SELECT hotel_id FROM public.perfiles WHERE id = auth.uid()) OR 
    EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'super_admin')
);

CREATE POLICY "Managers pueden gestionar inventario de su hotel" 
ON public.inventario FOR ALL TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.perfiles 
        WHERE id = auth.uid() 
        AND (
            (rol IN ('admin', 'super_admin', 'direccion', 'mantenimiento') AND hotel_id = public.inventario.hotel_id) OR
            (rol = 'super_admin')
        )
    )
);

-- 3. REPARAR POLÍTICAS DE CHAT (CANALES)
DROP POLICY IF EXISTS "Usuarios pueden ver canales de su hotel" ON public.canales;
CREATE POLICY "Usuarios pueden ver canales de su hotel" 
ON public.canales FOR SELECT TO authenticated 
USING (
    hotel_id = (SELECT hotel_id FROM public.perfiles WHERE id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'super_admin')
);

-- 4. REPARAR POLÍTICAS DE MENSAJES
DROP POLICY IF EXISTS "Usuarios pueden ver mensajes de su hotel" ON public.mensajes;
CREATE POLICY "Usuarios pueden ver mensajes de su hotel" 
ON public.mensajes FOR SELECT TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.canales 
        WHERE id = public.mensajes.channel 
        AND (
            hotel_id = (SELECT hotel_id FROM public.perfiles WHERE id = auth.uid()) OR
            EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'super_admin')
        )
    )
);
