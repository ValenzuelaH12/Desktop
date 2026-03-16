-- 1. Asegurar que las columnas existen en la tabla canales
alter table public.canales add column if not exists type text default 'public' check (type in ('public', 'private', 'direct'));
alter table public.canales add column if not exists created_by uuid references public.perfiles(id);

-- 2. Asegurar que existe la tabla de miembros (necesaria para DMs y permisos)
create table if not exists public.canal_miembros (
  id uuid default gen_random_uuid() primary key,
  canal_id text not null,
  user_id uuid references public.perfiles(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(canal_id, user_id)
);

-- 3. Habilitar RLS en la tabla de miembros
alter table public.canal_miembros enable row level security;

-- 4. Habilitar borrado de mensajes individualmente
do $$ begin 
  drop policy if exists "Usuarios pueden borrar sus propios mensajes" on public.mensajes;
  create policy "Usuarios pueden borrar sus propios mensajes" on public.mensajes 
  for delete to authenticated 
  using (
    (auth.uid())::text = (sender_id)::text 
    or exists (select 1 from public.perfiles p where (p.id)::text = (auth.uid())::text and p.rol in ('admin', 'super_admin', 'direccion'))
  );
exception when others then null; end $$;

-- 5. Habilitar borrado de canales (para borrar conversaciones completas)
do $$ begin 
  drop policy if exists "Usuarios pueden borrar canales privados o DMs" on public.canales;
  create policy "Usuarios pueden borrar canales privados o DMs" on public.canales 
  for delete to authenticated 
  using (
    (type in ('direct', 'private') and exists (select 1 from public.canal_miembros cm where (cm.canal_id)::text = (id)::text and (cm.user_id)::text = (auth.uid())::text))
    or exists (select 1 from public.perfiles p where (p.id)::text = (auth.uid())::text and p.rol in ('admin', 'super_admin', 'direccion'))
  );
exception when others then null; end $$;

-- 6. Habilitar borrado de miembros
do $$ begin 
  drop policy if exists "Usuarios pueden borrar miembros de canales" on public.canal_miembros;
  create policy "Usuarios pueden borrar miembros de canales" on public.canal_miembros 
  for delete to authenticated 
  using (
    (user_id)::text = (auth.uid())::text 
    or exists (select 1 from public.perfiles p where (p.id)::text = (auth.uid())::text and p.rol in ('admin', 'super_admin', 'direccion'))
  );
exception when others then null; end $$;
