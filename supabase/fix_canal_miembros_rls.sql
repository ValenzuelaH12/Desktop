-- Corregir permisos de RLS para la tabla canal_miembros
-- Esto permite crear nuevos chats (DMs) sin errores de política.

-- 1. Limpiar políticas antiguas si existen
drop policy if exists "Usuarios pueden ver miembros de sus canales" on public.canal_miembros;
drop policy if exists "Usuarios pueden unirse a canales o añadir miembros si son creadores" on public.canal_miembros;
drop policy if exists "Usuarios pueden insertar miembros en sus canales" on public.canal_miembros;

-- 2. Política de SELECCIÓN: Ver miembros de canales donde participas
create policy "Usuarios pueden ver miembros de sus canales"
on public.canal_miembros for select
to authenticated
using (
  user_id = auth.uid() 
  or 
  exists (
    select 1 from public.canal_miembros internal_cm 
    where internal_cm.canal_id = public.canal_miembros.canal_id 
    and internal_cm.user_id = auth.uid()
  )
);

-- 3. Política de INSERCIÓN: Permitir añadirse a sí mismo o añadir a otros si eres el creador
create policy "Usuarios pueden insertar miembros en sus canales"
on public.canal_miembros for insert
to authenticated
with check (
  -- Caso A: El usuario se añade a sí mismo
  user_id = auth.uid() 
  or 
  -- Caso B: El usuario es el creador del canal (necesario para añadir al otro en un DM)
  exists (
    select 1 from public.canales c 
    where c.id = canal_id and c.created_by = auth.uid()
  )
);

-- 4. Asegurar que RLS está activo (por si acaso)
alter table public.canal_miembros enable row level security;
