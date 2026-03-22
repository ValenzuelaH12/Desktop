-- SCHEMA DE FACTURACIÓN Y LICENCIAS (V-SUITE)
-- Integra soporte para planes, estados de suscripción y logs de pago.

-- 1. Actualizar tabla de hoteles con campos de facturación
alter table public.hoteles add column if not exists plan text default 'pro' check (plan in ('trial', 'basic', 'pro', 'enterprise'));
alter table public.hoteles add column if not exists subscription_status text default 'active' check (subscription_status in ('active', 'past_due', 'canceled', 'trialing', 'incomplete'));
alter table public.hoteles add column if not exists stripe_customer_id text;
alter table public.hoteles add column if not exists current_period_end timestamp with time zone;

-- 2. Crear tabla de logs de suscripciones para auditoría
create table if not exists public.suscripciones_log (
  id uuid default gen_random_uuid() primary key,
  hotel_id uuid references public.hoteles(id) on delete cascade not null,
  monto numeric(10, 2) not null,
  moneda text default 'EUR',
  metodo_pago text,
  stripe_invoice_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Habilitar RLS en suscripciones_log
alter table public.suscripciones_log enable row level security;

-- Solo admins del hotel pueden ver sus propios logs
create policy "Admins pueden ver logs de su hotel"
on public.suscripciones_log for select to authenticated
using ( 
  exists (
    select 1 from public.perfiles p 
    where p.id = auth.uid() 
    and p.hotel_id = public.suscripciones_log.hotel_id 
    and p.rol in ('admin', 'super_admin', 'direccion')
  )
);

-- 4. Actualizar tabla de hoteles existente con valores por defecto para los que no tengan
update public.hoteles set plan = 'pro', subscription_status = 'active' where plan is null;
