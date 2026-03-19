-- REINICIO TOTAL DE MANTENIMIENTO
-- Este script elimina todas las estructuras relacionadas con el sistema de mantenimiento preventivo

DROP TABLE IF EXISTS public.mantenimiento_entidades CASCADE;
DROP TABLE IF EXISTS public.mantenimiento_ejecucion CASCADE;
DROP TABLE IF EXISTS public.mantenimiento_preventivo CASCADE;
DROP TABLE IF EXISTS public.mantenimiento_plantillas CASCADE;
DROP TABLE IF EXISTS public.mantenimiento_categorias CASCADE;

-- Limpiar columnas añadidas a activos
ALTER TABLE public.activos 
DROP COLUMN IF EXISTS ultima_revision,
DROP COLUMN IF EXISTS proxima_revision;

-- Eliminar columna de selección manual si existiera (añadida recientemente)
ALTER TABLE public.mantenimiento_preventivo 
DROP COLUMN IF EXISTS entidades_especificas;
