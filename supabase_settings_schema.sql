-- Tabla de Ajustes Globales (Hotel Settings)
CREATE TABLE IF NOT EXISTS public.hotel_settings (
  key VARCHAR(255) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.hotel_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para hotel_settings: todos pueden leer, solo autenticados pueden actualizar
CREATE POLICY "Permitir lectura de hotel_settings a todos" ON public.hotel_settings
  FOR SELECT USING (true);

CREATE POLICY "Permitir actualizaciones de hotel_settings autenticados" ON public.hotel_settings
  FOR ALL USING (auth.role() = 'authenticated');

-- Tabla de Registro de Actividad (Auditoría)
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES public.perfiles(id) NOT NULL,
  accion VARCHAR(255) NOT NULL,
  detalles JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Políticas para activity_log: Solo autenticados pueden leer/insertar
CREATE POLICY "Permitir select a activity_log para autenticados" ON public.activity_log
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir insert a activity_log para autenticados" ON public.activity_log
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Insertar configuración por defecto (Se ejecutará si no existe la key)
INSERT INTO public.hotel_settings (key, value)
VALUES (
  'general_config',
  '{"hotel_name": "HotelOps Pro", "currency": "EUR", "timezone": "Europe/Madrid", "logo_url": null, "welcome_message": "Bienvenido a nuestro portal. Escanee el código para realizar su petición."}'::jsonb
) ON CONFLICT (key) DO NOTHING;
