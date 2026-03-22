-- ==========================================
-- ACTUALIZACIÓN DE POLÍTICAS: ELIMINACIÓN
-- ==========================================

-- Permitir a los usuarios eliminar sus propias notificaciones
DROP POLICY IF EXISTS "Usuarios eliminan sus propias notificaciones" ON public.notificaciones;
CREATE POLICY "Usuarios eliminan sus propias notificaciones" ON public.notificaciones
    FOR DELETE USING (auth.uid() = user_id);

-- Asegurar que UPDATE (para marcar como leída) tenga una política clara
DROP POLICY IF EXISTS "Usuarios marcan como leídas sus notificaciones" ON public.notificaciones;
CREATE POLICY "Usuarios marcan como leídas sus notificaciones" ON public.notificaciones
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
