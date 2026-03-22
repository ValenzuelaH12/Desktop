-- SOLUCIÓN A RECURSIÓN INFINITA EN RLS
-- Este script rompe el loop de dependencia entre canales y miembros usando funciones security definer.

-- 1. Funciones auxiliares (Evitan la recursión al no disparar políticas de RLS dentro de la función)
create or replace function public.es_miembro_del_canal(p_canal_id text)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.canal_miembros 
    where canal_id = p_canal_id and user_id = auth.uid()
  );
$$;

create or replace function public.es_creador_del_canal(p_canal_id text)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.canales 
    where id = p_canal_id and created_by = auth.uid()
  );
$$;

-- 2. Actualizar políticas de CANALES
drop policy if exists "Usuarios pueden ver canales públicos o donde son miembros" on public.canales;
drop policy if exists "Usuarios pueden crear canales" on public.canales;
drop policy if exists "Usuarios pueden actualizar sus canales" on public.canales;

create policy "Usuarios pueden ver canales públicos o donde son miembros" 
on public.canales for select to authenticated
using ( type = 'public' or created_by = auth.uid() or public.es_miembro_del_canal(id) );

create policy "Usuarios pueden crear canales" 
on public.canales for insert to authenticated 
with check ( auth.uid() is not null );

create policy "Usuarios pueden actualizar sus canales" 
on public.canales for update to authenticated
using ( created_by = auth.uid() or public.es_miembro_del_canal(id) );

-- 3. Actualizar políticas de MIEMBROS
drop policy if exists "Usuarios pueden ver miembros de sus canales" on public.canal_miembros;
drop policy if exists "Usuarios pueden insertar miembros en sus canales" on public.canal_miembros;
drop policy if exists "Usuarios pueden actualizar miembros" on public.canal_miembros;

create policy "Usuarios pueden ver miembros de sus canales" 
on public.canal_miembros for select to authenticated
using ( user_id = auth.uid() or public.es_miembro_del_canal(canal_id) );

create policy "Usuarios pueden insertar miembros en sus canales" 
on public.canal_miembros for insert to authenticated
with check ( user_id = auth.uid() or public.es_creador_del_canal(canal_id) );

create policy "Usuarios pueden actualizar miembros" 
on public.canal_miembros for update to authenticated
using ( user_id = auth.uid() or public.es_creador_del_canal(canal_id) );
