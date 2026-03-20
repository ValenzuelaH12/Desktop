-- MigraciÃ³n de CorrecciÃ³n para Multi-tenant: Trigger de Perfiles
-- Corregir la funciÃ³n handle_new_user para que propague el hotel_id (identificador UUID) 
-- a la tabla de perfiles, solucionando el problema de invisibilidad de usuarios nuevos.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    v_hotel_id uuid;
BEGIN
    -- Intentar obtener hotel_id de los metadatos (formato UUID)
    -- Si no existe o no es un UUID vÃ¡lido, asignar el Hotel Principal por defecto
    BEGIN
        v_hotel_id := (new.raw_user_meta_data->>'hotel_id')::uuid;
    EXCEPTION WHEN OTHERS THEN
        v_hotel_id := '00000000-0000-0000-0000-000000000000';
    END;

    INSERT INTO public.perfiles (id, nombre, rol, hotel_id, permisos, hotel)
    VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'nombre', 'Nuevo Usuario'), 
        COALESCE(new.raw_user_meta_data->>'rol', 'recepcion'), 
        COALESCE(v_hotel_id, '00000000-0000-0000-0000-000000000000'),
        COALESCE(
          ARRAY(SELECT jsonb_array_elements_text(COALESCE(new.raw_user_meta_data->'permisos', '[]'::jsonb))), 
          ARRAY['dashboard', 'incidencias', 'chat']::text[]
        ),
        COALESCE(new.raw_user_meta_data->>'hotel', 'Hotel Principal') -- Mantener hotel (texto) por compatibilidad
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Saneamiento: Recuperar usuarios "escondidos" (sin hotel_id)
-- Les asignamos el hotel principal para que al menos el administrador principal los vea
UPDATE public.perfiles 
SET hotel_id = '00000000-0000-0000-0000-000000000000' 
WHERE hotel_id IS NULL;

-- Asegurar que la columna 'hotel' tambiÃ©n tenga un valor por coherencia
UPDATE public.perfiles 
SET hotel = 'Hotel Principal' 
WHERE hotel IS NULL OR hotel = 'Hotel Central';
