-- Tabla para configuración dinámica de planes
CREATE TABLE IF NOT EXISTS public.configuracion_planes (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    precio_mensual NUMERIC NOT NULL,
    precio_anual NUMERIC NOT NULL,
    descripcion TEXT,
    icon TEXT DEFAULT 'Zap',
    color TEXT DEFAULT 'primary',
    features JSONB DEFAULT '[]'::jsonb,
    destacado BOOLEAN DEFAULT false,
    orden INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.configuracion_planes ENABLE ROW LEVEL SECURITY;

-- Políticas: Lectura para todos los autenticados, Escritura solo para Super Admins
CREATE POLICY "Planes: Lectura publica para usuarios autenticados" 
ON public.configuracion_planes FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Planes: Solo super_admin puede modificar" 
ON public.configuracion_planes FOR ALL 
TO authenticated 
USING (
    public.is_super_admin()
);

-- Datos iniciales (Starter, Profesional, Enterprise)
INSERT INTO public.configuracion_planes (id, nombre, precio_mensual, precio_anual, descripcion, icon, color, features, destacado, orden)
VALUES 
('basic', 'Starter V-Suite', 99, 79, 'Pequeños alojamientos', 'Clock', 'info', '["Hasta 30 habitaciones", "Gestión de incidencias", "Panel de mantenimiento", "Notificaciones push", "Help center básico"]', false, 1),
('pro', 'Professional', 249, 199, 'Hoteles independientes', 'Zap', 'accent', '["Habitaciones ilimitadas", "Analítica V-Insights", "V-Nexus Real-time", "V-Scan QR Premium", "Asistente V-AI (IA)", "Soporte 24/7"]', true, 2),
('enterprise', 'Chain & Enterprise', 499, 399, 'Cadenas y Grupos', 'Shield', 'success', '["Gestión de cadena (V-Chain)", "Propagación de datos", "Brand Customization", "API de integración", "Acceso BI Global", "Manager dedicado"]', false, 3)
ON CONFLICT (id) DO NOTHING;
