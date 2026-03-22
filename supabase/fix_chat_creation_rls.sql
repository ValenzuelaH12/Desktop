-- Fix para que el creador de un canal privado/directo pueda seleccionarlo inmediatamente tras crearlo
-- Esto evita el error de "new row violates row-level security policy" al añadir miembros al canal.

drop policy if exists "Usuarios pueden ver canales públicos o donde son miembros" on public.canales;

create policy "Usuarios pueden ver canales públicos o donde son miembros" on public.canales for select using (
  type = 'public' or
  created_by = auth.uid() or
  exists (select 1 from public.canal_miembros cm where (cm.canal_id)::text = (id)::text and (cm.user_id)::text = (auth.uid())::text)
);
