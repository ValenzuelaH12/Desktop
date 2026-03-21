-- Migración para prevenir duplicados en preventivos (V3 - Inmutabilidad corregida)
-- Ejecutar en el SQL Editor de Supabase

-- 1. Limpiar duplicados existentes en asignaciones
DELETE FROM public.preventivo_asignaciones a
USING public.preventivo_asignaciones b
WHERE a.id > b.id 
  AND a.plantilla_id = b.plantilla_id 
  AND a.entidad_id = b.entidad_id;

-- 2. Añadir restricción de unicidad a las asignaciones
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_assignment_per_template') THEN
        ALTER TABLE public.preventivo_asignaciones 
        ADD CONSTRAINT unique_assignment_per_template UNIQUE (plantilla_id, entidad_id);
    END IF;
END $$;

-- 3. Crear un índice único para las revisiones por día
-- Se usa 'AT TIME ZONE 'UTC' para que la expresión sea INMUTABLE y el índice sea válido
CREATE UNIQUE INDEX IF NOT EXISTS unique_revision_daily_idx 
ON public.preventivo_revisiones (
    plantilla_id, 
    entidad_id, 
    (CAST(created_at AT TIME ZONE 'UTC' AS date))
);

-- Advertencia: Si ya tienes duplicados hoy, el índice anterior fallará hasta que los limpies.
-- Consulta para limpiar duplicados de hoy si es necesario:
-- DELETE FROM public.preventivo_revisiones WHERE id IN (
--   SELECT id FROM (
--     SELECT id, ROW_NUMBER() OVER (PARTITION BY plantilla_id, entidad_id, CAST(created_at AT TIME ZONE 'UTC' AS date) ORDER BY id) as rn
--     FROM public.preventivo_revisiones
--     WHERE created_at >= CURRENT_DATE
--   ) t WHERE t.rn > 1
-- );
