-- FIX FINAL DE RLS PARA CHAT (Canales y Miembros)
-- Este script asegura que la creación de DMs sea fluida y sin errores de clave duplicada o RLS.

-- ==========================================
-- 1. TABLA: canales
-- ==========================================
alter table public.canales enable row level security;

-- SELECT: Ver canales públicos, creados por uno mismo, o donde uno es miembro
drop policy if exists "Usuarios pueden ver canales públicos o donde son miembros" on public.canales;
create policy "Usuarios pueden ver canales públicos o donde son miembros"
on public.canales for select to authenticated
using (
  type = 'public' or
  created_by = auth.uid() or
  exists (select 1 from public.canal_miembros cm where cm.canal_id = public.canales.id and cm.user_id = auth.uid())
);

-- INSERT: Permitir a cualquier usuario autenticado crear canales
drop policy if exists "Usuarios pueden crear canales" on public.canales;
create policy "Usuarios pueden crear canales"
on public.canales for insert to authenticated
with check ( auth.uid() is not null );

-- UPDATE: Permitir actualizar canales que uno creó o donde es miembro (para DMs)
drop policy if exists "Usuarios pueden actualizar sus canales" on public.canales;
create policy "Usuarios pueden actualizar sus canales"
on public.canales for update to authenticated
using (
  created_by = auth.uid() or
  exists (select 1 from public.canal_miembros cm where cm.canal_id = public.canales.id and cm.user_id = auth.uid())
);

-- ==========================================
-- 2. TABLA: canal_miembros
-- ==========================================
alter table public.canal_miembros enable row level security;

-- SELECT: Ver miembros de canales donde uno participa
drop policy if exists "Usuarios pueden ver miembros de sus canales" on public.canal_miembros;
create policy "Usuarios pueden ver miembros de sus canales"
on public.canal_miembros for select to authenticated
using (
  user_id = auth.uid() or 
  exists (select 1 from public.canal_miembros cm where cm.canal_id = public.canal_miembros.canal_id and cm.user_id = auth.uid())
);

-- INSERT/UPSERT: Permitir unirse o añadir miembros si eres el creador
drop policy if exists "Usuarios pueden insertar miembros en sus canales" on public.canal_miembros;
create policy "Usuarios pueden insertar miembros en sus canales"
on public.canal_miembros for insert to authenticated
with check (
  user_id = auth.uid() or 
  exists (select 1 from public.canales c where c.id = canal_id and c.created_by = auth.uid())
);

-- UPDATE: Necesario para que el upsert no falle si ya existe la fila
drop policy if exists "Usuarios pueden actualizar miembros" on public.canal_miembros;
create policy "Usuarios pueden actualizar miembros"
on public.canal_miembros for update to authenticated
using (
  user_id = auth.uid() or 
  exists (select 1 from public.canales c where c.id = canal_id and c.created_by = auth.uid())
);
