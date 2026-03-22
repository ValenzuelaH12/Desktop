-- ==========================================
-- V-SUITE: ACTUALIZACIÓN DE CONSTRAINT DE ROLES
-- ==========================================

-- 1. Eliminar el constraint antiguo (el nombre suele ser perfiles_rol_check)
ALTER TABLE public.perfiles 
DROP CONSTRAINT IF EXISTS perfiles_rol_check;

-- 2. Añadir el nuevo constraint con 'chain_manager' incluido
ALTER TABLE public.perfiles 
ADD CONSTRAINT perfiles_rol_check 
CHECK (rol IN ('super_admin', 'admin', 'direccion', 'mantenimiento', 'recepcion', 'limpieza', 'gobernanta', 'chain_manager'));

-- 3. Ahora sí, actualizar el rol de David Gil
UPDATE public.perfiles 
SET rol = 'chain_manager'
WHERE nombre ILIKE '%David Gil%';

-- 4. Verificar
SELECT id, nombre, rol 
FROM public.perfiles 
WHERE nombre ILIKE '%David Gil%';
