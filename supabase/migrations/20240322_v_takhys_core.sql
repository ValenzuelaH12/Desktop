-- NÚCLEO DE DATOS V-TAKHYIS (PROCEDIMIENTOS Y CUMPLIMIENTO)

-- 1. Tablas Maestras
CREATE TABLE IF NOT EXISTS public.operacion_procedimientos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    hotel_id uuid REFERENCES public.hoteles(id) ON DELETE CASCADE,
    nombre text NOT NULL,
    descripcion text,
    categoria text DEFAULT 'interno', -- 'legal', 'interno', 'mantenimiento'
    departamento text NOT NULL, -- 'mantenimiento', 'pisos', 'recepcion', 'cocina'
    frecuencia text NOT NULL, -- 'diaria', 'semanal', 'mensual', 'anual'
    checklist_config jsonb DEFAULT '[]', -- Configuración de campos (nombre, tipo, min, max, opcional)
    activo boolean DEFAULT true,
    creado_en timestamptz DEFAULT now(),
    actualizado_en timestamptz DEFAULT now()
);

-- 2. Tareas Programadas (Instancias)
CREATE TABLE IF NOT EXISTS public.operacion_tareas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    hotel_id uuid REFERENCES public.hoteles(id) ON DELETE CASCADE,
    procedimiento_id uuid REFERENCES public.operacion_procedimientos(id) ON DELETE CASCADE,
    entidad_tipo text NOT NULL, -- 'habitacion', 'activo', 'general'
    entidad_id uuid, -- ID de habitacion o activo
    fecha_programada date NOT NULL,
    estado text DEFAULT 'pendiente', -- 'pendiente', 'en_curso', 'completada', 'atrasada'
    usuario_asignado_id uuid REFERENCES auth.users(id),
    creado_en timestamptz DEFAULT now()
);

-- 3. Registros de Ejecución
CREATE TABLE IF NOT EXISTS public.operacion_registros (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tarea_id uuid REFERENCES public.operacion_tareas(id) ON DELETE CASCADE,
    usuario_id uuid REFERENCES auth.users(id),
    fecha_ejecucion timestamptz DEFAULT now(),
    datos_json jsonb DEFAULT '{}', -- Valores de los campos (ej: { "temperatura": 72.5, "limpieza_ok": true })
    fotos_url text[] DEFAULT '{}',
    notas text,
    tiene_alerta boolean DEFAULT false,
    hotel_id uuid REFERENCES public.hoteles(id) ON DELETE CASCADE
);

-- 4. Sistema de Alertas
CREATE TABLE IF NOT EXISTS public.operacion_alertas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    hotel_id uuid REFERENCES public.hoteles(id) ON DELETE CASCADE,
    registro_id uuid REFERENCES public.operacion_registros(id) ON DELETE SET NULL,
    mensaje text NOT NULL,
    gravedad text DEFAULT 'info', -- 'info', 'warning', 'critical'
    leida boolean DEFAULT false,
    creado_en timestamptz DEFAULT now()
);

-- RLS (Habilatando seguridad por hotel)
ALTER TABLE public.operacion_procedimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operacion_tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operacion_registros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operacion_alertas ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (asumiendo patrón existente)
CREATE POLICY "Users can see their hotel procedures" ON public.operacion_procedimientos
    FOR SELECT USING (hotel_id IN (SELECT hotel_id FROM public.perfiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage their hotel procedures" ON public.operacion_procedimientos
    FOR ALL USING (hotel_id IN (SELECT hotel_id FROM public.perfiles WHERE id = auth.uid() AND (rol = 'admin' OR rol = 'super_admin')));

-- Repetir para el resto (Simplificado para brevedad, expandible)
CREATE POLICY "Hotel access for tasks" ON public.operacion_tareas FOR ALL USING (hotel_id IN (SELECT hotel_id FROM public.perfiles WHERE id = auth.uid()));
CREATE POLICY "Hotel access for registros" ON public.operacion_registros FOR ALL USING (hotel_id IN (SELECT hotel_id FROM public.perfiles WHERE id = auth.uid()));
CREATE POLICY "Hotel access for alertas" ON public.operacion_alertas FOR ALL USING (hotel_id IN (SELECT hotel_id FROM public.perfiles WHERE id = auth.uid()));
