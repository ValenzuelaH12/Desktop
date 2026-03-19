-- Migration: Add custom checklist support to maintenance tasks
-- Author: Antigravity
-- Date: 2024-03-19

-- 1. Add checklist_items column to mantenimiento_preventivo
ALTER TABLE public.mantenimiento_preventivo 
ADD COLUMN IF NOT EXISTS checklist_items text[] DEFAULT '{}';

-- 2. Optional: If you want to migrate existing tasks to use their category's subcategories
-- (This would require a join but is better done manually if needed)

COMMENT ON COLUMN public.mantenimiento_preventivo.checklist_items IS 'Lista de tareas manuales para el checklist de inspección';
