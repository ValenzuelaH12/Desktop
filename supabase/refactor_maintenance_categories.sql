-- REFACTORIZACIÓN FINAL DE MANTENIMIENTO (V7)
-- Pivot de Plantillas a Categoría/Subcategoría Dinámica con Auto-Recuperación

-- 1. Asegurar tabla de hoteles (Base del multi-tenant)
CREATE TABLE IF NOT EXISTS public.hoteles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- 2. Asegurar columnas en mantenimiento_preventivo
ALTER TABLE public.mantenimiento_preventivo ADD COLUMN IF NOT EXISTS categoria text;
ALTER TABLE public.mantenimiento_preventivo ADD COLUMN IF NOT EXISTS subcategoria text;
ALTER TABLE public.mantenimiento_preventivo ADD COLUMN IF NOT EXISTS hotel_id uuid REFERENCES public.hoteles(id);

-- 3. Crear tabla de categorías
CREATE TABLE IF NOT EXISTS public.mantenimiento_categorias (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre text NOT NULL,
    subcategorias text[] DEFAULT '{}',
    hotel_id uuid REFERENCES public.hoteles(id),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(nombre, hotel_id) -- Permite usar ON CONFLICT
);

-- 4. Habilitar RLS
ALTER TABLE public.mantenimiento_categorias ENABLE ROW LEVEL SECURITY;

-- 5. Eliminar políticas antiguas si existen para evitar errores de duplicado
DROP POLICY IF EXISTS "Categorías visibles" ON public.mantenimiento_categorias;
DROP POLICY IF EXISTS "Gestión de categorías" ON public.mantenimiento_categorias;

-- 6. Crear políticas robustas
CREATE POLICY "Categorías visibles" ON public.mantenimiento_categorias
FOR SELECT TO authenticated 
USING (
    hotel_id IS NULL OR 
    hotel_id = (SELECT hotel_id FROM public.perfiles WHERE id = auth.uid()) OR 
    EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'super_admin')
);

CREATE POLICY "Gestión de categorías" ON public.mantenimiento_categorias
FOR ALL TO authenticated 
USING (
    EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND (rol IN ('admin', 'super_admin', 'direccion', 'mantenimiento')))
);

-- 7. Insertar datos base (Seguro contra ejecuciones repetidas)
INSERT INTO public.mantenimiento_categorias (nombre, subcategorias, hotel_id)
VALUES 
('Zonas Comunes', ARRAY['Recepción', 'Pasillos', 'Fachada', 'Piscina'], NULL),
('Habitaciones', ARRAY['Mobiliario', 'Baño', 'Climatización'], NULL),
('Maquinaria', ARRAY['Filtros HVAC', 'Bombas', 'Ascensores'], NULL)
ON CONFLICT (nombre, hotel_id) DO NOTHING;
