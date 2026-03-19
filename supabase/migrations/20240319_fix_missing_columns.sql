-- Final schema fix for maintenance system
-- Adds missing columns to mantenimiento_preventivo

-- 1. Ensure columns exist in mantenimiento_preventivo
ALTER TABLE public.mantenimiento_preventivo ADD COLUMN IF NOT EXISTS tipo text DEFAULT 'mantenimiento';
ALTER TABLE public.mantenimiento_preventivo ADD COLUMN IF NOT EXISTS foto_url text;
ALTER TABLE public.mantenimiento_preventivo ADD COLUMN IF NOT EXISTS checklist_items text[] DEFAULT '{}';

-- 2. Add comment for clarity
COMMENT ON COLUMN public.mantenimiento_preventivo.tipo IS 'Categoría de la tarea: mantenimiento, evento, revision';

-- 3. Notify that the schema has changed
-- After running this, please refresh your browser to reload the Supabase schema cache.
