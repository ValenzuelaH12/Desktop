-- MIGRACIÓN: Gestión Manual de Tipos de Incidencias (Multi-tenant)

-- 1. Añadir hotel_id si no existe
ALTER TABLE public.tipos_problemas ADD COLUMN IF NOT EXISTS hotel_id UUID REFERENCES public.hoteles(id);

-- 2. Asegurar columna categoría (por si acaso no existe en alguna instancia)
ALTER TABLE public.tipos_problemas ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'general';

-- 3. Eliminar políticas antiguas para evitar duplicados/conflictos
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver tipos" ON public.tipos_problemas;
DROP POLICY IF EXISTS "Solo administradores pueden manejar tipos" ON public.tipos_problemas;

-- 4. Crear nuevas políticas RLS Multi-tenant
-- Los usuarios pueden ver los tipos globales (hotel_id IS NULL) o los de su propio hotel
CREATE POLICY "Tipos visibles" ON public.tipos_problemas
FOR SELECT TO authenticated
USING (
    hotel_id IS NULL OR 
    hotel_id = (SELECT hotel_id FROM public.perfiles WHERE id = auth.uid()) OR 
    EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'super_admin')
);

-- Solo administradores (y roles superiores) pueden insertar/modificar los tipos de su propio hotel
CREATE POLICY "Gestión de tipos" ON public.tipos_problemas
FOR ALL TO authenticated
USING (
    (hotel_id = (SELECT hotel_id FROM public.perfiles WHERE id = auth.uid()) OR EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'super_admin')) AND
    EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin', 'super_admin', 'direccion', 'mantenimiento'))
)
WITH CHECK (
    (hotel_id = (SELECT hotel_id FROM public.perfiles WHERE id = auth.uid()) OR EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'super_admin'))
);

-- 5. No es necesario insertar datos base aquí si ya existen globales,
-- pero nos aseguramos que los existentes sean globales (hotel_id NULL)
UPDATE public.tipos_problemas SET hotel_id = NULL WHERE hotel_id IS NULL;
