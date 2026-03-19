-- FIX: Update frequency constraint for maintenance tasks
-- Author: Antigravity
-- Date: 2024-03-19

-- 1. First, find and drop the existing constraint if it exists
-- We search for the constraint on the 'frecuencia' column
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mantenimiento_preventivo_frecuencia_check') THEN
        ALTER TABLE public.mantenimiento_preventivo DROP CONSTRAINT mantenimiento_preventivo_frecuencia_check;
    END IF;
END $$;

-- 2. Add the updated constraint with all supported frequencies
ALTER TABLE public.mantenimiento_preventivo
ADD CONSTRAINT mantenimiento_preventivo_frecuencia_check 
CHECK (frecuencia IN ('eventual', 'diaria', 'semanal', 'mensual', 'trimestral', 'semestral', 'anual'));

-- 3. Update the comment to reflect the changes
COMMENT ON COLUMN public.mantenimiento_preventivo.frecuencia IS 'Frecuencia de la tarea: eventual, diaria, semanal, mensual, trimestral, semestral, anual';
