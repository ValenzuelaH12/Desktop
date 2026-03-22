-- ==========================================================
-- SETUP WEBHOOK PARA NOTIFICACIONES PUSH AUTOMÁTICAS
-- ==========================================================

-- 1. Habilitar extensiones necesarias (si no lo están)
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";

-- 2. Crear la función del Trigger que llama a la Edge Function
CREATE OR REPLACE FUNCTION public.trigger_push_notification()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://euyfcclyofghwmsizqis.supabase.co/functions/v1/push-notifications', -- URL de tu Edge Function
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || 'TU_SERVICE_ROLE_KEY' -- Importante: Usar Service Role Key para bypassing RLS
      ),
      body := jsonb_build_object('record', row_to_json(NEW))
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Activar el Trigger en la tabla 'notificaciones'
DROP TRIGGER IF EXISTS on_notification_created ON public.notificaciones;
CREATE TRIGGER on_notification_created
  AFTER INSERT ON public.notificaciones
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_push_notification();

-- NOTA: Reemplaza 'TU_SERVICE_ROLE_KEY' con tu clave real (Service Role) 
-- para que la función tenga permisos de llamar a la Edge Function.
