-- Añadir soporte para reacciones en mensajes
ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}';

-- Habilitar Presence (si no está ya habilitado)
-- Nota: Supabase Realtime Presence ya funciona sobre los canales,
-- no requiere cambios en el esquema pero sí asegurar que RLS permite ver 
-- los mensajes para sincronizar estados.
