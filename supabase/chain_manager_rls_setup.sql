-- ==========================================
-- V-SUITE: CHAIN MANAGER & GLOBAL VISIBILITY
-- ==========================================

-- 1. Función para verificar visibilidad global
CREATE OR REPLACE FUNCTION public.can_view_all_hotels()
RETURNS BOOLEAN AS $$
DECLARE
    user_rol TEXT;
    hotel_plan TEXT;
BEGIN
    -- Obtener rol del usuario y plan de su hotel
    SELECT p.rol, h.plan INTO user_rol, hotel_plan
    FROM public.perfiles p
    JOIN public.hoteles h ON p.hotel_id = h.id
    WHERE p.id = auth.uid();

    -- Retornar true si es super_admin O si es chain_manager con plan enterprise
    RETURN (user_rol = 'super_admin') OR (user_rol = 'chain_manager' AND hotel_plan = 'enterprise');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ACTUALIZACIÓN DE POLÍTICAS RLS EN TABLAS CLAVE

-- HOTELES
DROP POLICY IF EXISTS "Super admins ven todos los hoteles" ON public.hoteles;
CREATE POLICY "Visibilidad Global: Hoteles" ON public.hoteles
FOR ALL USING (public.can_view_all_hotels());

-- PERFILES
DROP POLICY IF EXISTS "Super admins ven todos los perfiles" ON public.perfiles;
CREATE POLICY "Visibilidad Global: Perfiles" ON public.perfiles
FOR ALL USING (public.can_view_all_hotels());

-- INCIDENCIAS
DROP POLICY IF EXISTS "Super admins ven todas las incidencias" ON public.incidencias;
CREATE POLICY "Visibilidad Global: Incidencias" ON public.incidencias
FOR ALL USING (public.can_view_all_hotels());

-- ACTIVOS
DROP POLICY IF EXISTS "Super admins ven todos los activos" ON public.activos;
CREATE POLICY "Visibilidad Global: Activos" ON public.activos
FOR ALL USING (public.can_view_all_hotels());

-- ZONAS
DROP POLICY IF EXISTS "Super admins ven todas las zonas" ON public.zonas;
CREATE POLICY "Visibilidad Global: Zonas" ON public.zonas
FOR ALL USING (public.can_view_all_hotels());

-- PREVENTIVO (TODAS LAS TABLAS)
DROP POLICY IF EXISTS "Visibilidad Global: Plantillas" ON public.preventivo_plantillas;
CREATE POLICY "Visibilidad Global: Plantillas" ON public.preventivo_plantillas FOR ALL USING (public.can_view_all_hotels());

DROP POLICY IF EXISTS "Visibilidad Global: Categorias" ON public.preventivo_categorias;
CREATE POLICY "Visibilidad Global: Categorias" ON public.preventivo_categorias FOR ALL USING (public.can_view_all_hotels());

DROP POLICY IF EXISTS "Visibilidad Global: Items" ON public.preventivo_items;
CREATE POLICY "Visibilidad Global: Items" ON public.preventivo_items FOR ALL USING (public.can_view_all_hotels());

DROP POLICY IF EXISTS "Visibilidad Global: Asignaciones" ON public.preventivo_asignaciones;
CREATE POLICY "Visibilidad Global: Asignaciones" ON public.preventivo_asignaciones FOR ALL USING (public.can_view_all_hotels());

DROP POLICY IF EXISTS "Visibilidad Global: Revisiones" ON public.preventivo_revisiones;
CREATE POLICY "Visibilidad Global: Revisiones" ON public.preventivo_revisiones FOR ALL USING (public.can_view_all_hotels());

DROP POLICY IF EXISTS "Visibilidad Global: Resultados" ON public.preventivo_resultados;
CREATE POLICY "Visibilidad Global: Resultados" ON public.preventivo_resultados FOR ALL USING (public.can_view_all_hotels());

-- INVENTARIO
DROP POLICY IF EXISTS "Super admins ven todo el inventario" ON public.inventario;
DROP POLICY IF EXISTS "Visibilidad Global: Inventario" ON public.inventario;
CREATE POLICY "Visibilidad Global: Inventario" ON public.inventario
FOR ALL USING (public.can_view_all_hotels());

-- LECTURAS
DROP POLICY IF EXISTS "Super admins ven todas las lecturas" ON public.lecturas;
DROP POLICY IF EXISTS "Visibilidad Global: Lecturas" ON public.lecturas;
CREATE POLICY "Visibilidad Global: Lecturas" ON public.lecturas
FOR ALL USING (public.can_view_all_hotels());

DROP POLICY IF EXISTS "Visibilidad Global: Contadores" ON public.contadores;
CREATE POLICY "Visibilidad Global: Contadores" ON public.contadores
FOR ALL USING (public.can_view_all_hotels());

-- CHAT / MENSAJES
DROP POLICY IF EXISTS "Super admins ven todos los mensajes" ON public.mensajes;
DROP POLICY IF EXISTS "Visibilidad Global: Mensajes" ON public.mensajes;
CREATE POLICY "Visibilidad Global: Mensajes" ON public.mensajes
FOR ALL USING (public.can_view_all_hotels());

DROP POLICY IF EXISTS "Visibilidad Global: Canales" ON public.canales;
CREATE POLICY "Visibilidad Global: Canales" ON public.canales
FOR ALL USING (public.can_view_all_hotels());

DROP POLICY IF EXISTS "Visibilidad Global: Miembros Canal" ON public.canal_miembros;
CREATE POLICY "Visibilidad Global: Miembros Canal" ON public.canal_miembros
FOR ALL USING (public.can_view_all_hotels());

-- AUDIT LOGS
DROP POLICY IF EXISTS "Super admins ven logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Visibilidad Global: Audit Logs" ON public.audit_logs;
CREATE POLICY "Visibilidad Global: Audit Logs" ON public.audit_logs
FOR ALL USING (public.can_view_all_hotels());

-- 3. Asegurar que los Chain Managers puedan ver los planes dinámicos
DROP POLICY IF EXISTS "Planes: Solo super_admin puede modificar" ON public.configuracion_planes;
DROP POLICY IF EXISTS "Planes: SuperAdmin y ChainManagers modifican" ON public.configuracion_planes;
DROP POLICY IF EXISTS "Planes: SuperAdmin y ChainManagers pueden ver" ON public.configuracion_planes;
DROP POLICY IF EXISTS "Planes: Solo SuperAdmin modifica" ON public.configuracion_planes;

CREATE POLICY "Planes: Lectura para todos" 
ON public.configuracion_planes FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Planes: Solo SuperAdmin gestiona" 
ON public.configuracion_planes FOR ALL 
TO authenticated 
USING (public.is_super_admin());
