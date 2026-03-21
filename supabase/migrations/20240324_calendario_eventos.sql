-- Migration: Create calendario_eventos table

CREATE TABLE IF NOT EXISTS calendario_eventos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID REFERENCES hoteles(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    fecha TIMESTAMPTZ NOT NULL,
    tipo TEXT DEFAULT 'evento',
    color TEXT DEFAULT '#3b82f6',
    creado_por UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE calendario_eventos ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Usuarios pueden ver eventos de su hotel"
    ON calendario_eventos FOR SELECT
    USING (
        hotel_id IN (
            SELECT hotel_id FROM perfiles WHERE id = auth.uid()
        )
        OR 
        EXISTS (
            SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'superadmin'
        )
    );

CREATE POLICY "Usuarios pueden crear eventos en su hotel"
    ON calendario_eventos FOR INSERT
    WITH CHECK (
        hotel_id IN (
            SELECT hotel_id FROM perfiles WHERE id = auth.uid()
        )
        OR 
        EXISTS (
            SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'superadmin'
        )
    );

CREATE POLICY "Usuarios pueden actualizar eventos de su hotel"
    ON calendario_eventos FOR UPDATE
    USING (
        hotel_id IN (
            SELECT hotel_id FROM perfiles WHERE id = auth.uid()
        )
        OR 
        EXISTS (
            SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'superadmin'
        )
    );

CREATE POLICY "Usuarios pueden eliminar eventos de su hotel"
    ON calendario_eventos FOR DELETE
    USING (
        hotel_id IN (
            SELECT hotel_id FROM perfiles WHERE id = auth.uid()
        )
        OR 
        EXISTS (
            SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'superadmin'
        )
    );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_calendario_eventos_updated_at ON calendario_eventos;
CREATE TRIGGER update_calendario_eventos_updated_at
    BEFORE UPDATE ON calendario_eventos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
