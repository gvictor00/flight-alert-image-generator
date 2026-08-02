create extension if not exists pgcrypto;

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  origem text not null,
  destino text not null,
  programa text not null default '',
  cia text not null default '',
  grupo text not null,
  data date not null default current_date,
  autor text not null default '',
  obs text not null default '',
  image_url text,
  par_id text,
  card_data jsonb,
  enviado boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.alerts drop constraint if exists alerts_grupo_check;

update public.alerts
set grupo = U&'Experi\00EAncias Ao Vivo'
where grupo = 'Experiencias Ao Vivo';

alter table public.alerts
add constraint alerts_grupo_check
check (grupo in ('Executiva com Milhas', 'FirstClass', 'Go Miles Club', U&'Experi\00EAncias Ao Vivo', 'Milhas Ao Vivo'));

create index if not exists alerts_data_idx on public.alerts (data desc);
create index if not exists alerts_grupo_idx on public.alerts (grupo);
create index if not exists alerts_rota_idx on public.alerts (origem, destino);
create index if not exists alerts_par_id_idx on public.alerts (par_id);

create table if not exists public.route_settings (
  route_key text primary key,
  min_days integer not null default 10 check (min_days between 1 and 365),
  updated_at timestamptz not null default now()
);

-- Create a public Supabase Storage bucket named: alert-cards
-- Or set SUPABASE_STORAGE_BUCKET to the bucket name used by the deployment.
-- Recommended bucket policy for this internal tool:
-- 1. allow server-side uploads through the API route only;
-- 2. allow public reads if card image links should be visible in dashboard history.
