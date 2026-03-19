-- RESET TOTAL DE MANTENIMIENTO (V3)
-- Eliminando todas las tablas relacionadas con intentos previos de mantenimiento preventivo y operativo.

DROP TABLE IF EXISTS public.mantenimiento_items_log CASCADE;
DROP TABLE IF EXISTS public.mantenimiento_tareas CASCADE;
DROP TABLE IF EXISTS public.mantenimiento_planes CASCADE;
DROP TABLE IF EXISTS public.preventivo_detalles CASCADE;
DROP TABLE IF EXISTS public.preventivo_inspecciones CASCADE;
DROP TABLE IF EXISTS public.mantenimiento_filtros CASCADE;

-- También limpiar cualquier tipo/enum custom si existen
DROP TYPE IF EXISTS public.frecuencia_mantenimiento CASCADE;
DROP TYPE IF EXISTS public.estado_item_checklist CASCADE;

-- Revertir cambios en activos si es necesario (limpiar columnas extras)
ALTER TABLE public.activos DROP COLUMN IF EXISTS habitacion_id CASCADE;
ALTER TABLE public.activos DROP COLUMN IF EXISTS estado CASCADE;
ALTER TABLE public.activos DROP COLUMN IF EXISTS ultima_inspeccion CASCADE;
ALTER TABLE public.activos DROP COLUMN IF EXISTS proxima_inspeccion CASCADE;
ALTER TABLE public.activos DROP COLUMN IF EXISTS ultima_revision CASCADE;
ALTER TABLE public.activos DROP COLUMN IF EXISTS proxima_revision CASCADE;
