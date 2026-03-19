-- Migración para permitir selección manual de entidades en mantenimiento
ALTER TABLE public.mantenimiento_preventivo 
ADD COLUMN IF NOT EXISTS entidades_especificas jsonb DEFAULT NULL;

COMMENT ON COLUMN public.mantenimiento_preventivo.entidades_especificas IS 'Almacena un array de IDs de habitaciones o zonas seleccionadas manualmente para la tarea';
