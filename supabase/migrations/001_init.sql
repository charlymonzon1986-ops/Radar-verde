-- Radar Verde: esquema inicial para el proyecto Supabase nuevo.
-- Ejecutar completo en el SQL Editor del proyecto (o con apply_migration).

-- =========================
-- Tablas
-- =========================
create table if not exists public.reservas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  zona text not null check (zona in ('Norte', 'Sur', 'Este', 'Oeste', 'Centro')),
  descripcion text not null default '',
  coordenadas double precision[] not null,
  google_maps_url text not null default '',
  fotos jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.fotos (
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid not null references public.reservas(id) on delete cascade,
  url text not null,
  autor text default 'Anónimo',
  created_at timestamptz not null default now()
);

create index if not exists fotos_reserva_id_idx on public.fotos (reserva_id);

-- =========================
-- RLS: lectura pública; subida de fotos abierta a anon (el frontend no tiene login)
-- =========================
alter table public.reservas enable row level security;
alter table public.fotos enable row level security;

create policy "reservas_select_public" on public.reservas
  for select to anon, authenticated using (true);

create policy "fotos_select_public" on public.fotos
  for select to anon, authenticated using (true);

create policy "fotos_insert_public" on public.fotos
  for insert to anon, authenticated with check (true);

-- =========================
-- Storage: bucket público "fotos"
-- =========================
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true)
on conflict (id) do update set public = true;

create policy "fotos_storage_select" on storage.objects
  for select to anon, authenticated using (bucket_id = 'fotos');

create policy "fotos_storage_insert" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'fotos');

-- =========================
-- Seed: reservas (coordenadas verificadas con Google Places)
-- descripcion vacía: completar después
-- =========================
insert into public.reservas (nombre, zona, descripcion, coordenadas, google_maps_url) values
  ('Reserva Natural del Pilar', 'Norte', '', array[-34.412654, -58.915912],
   'https://www.google.com/maps/search/?api=1&query=-34.412654,-58.915912'),
  ('Reserva Natural Ing. Maschwitz', 'Norte', '', array[-34.373027, -58.751614],
   'https://www.google.com/maps/search/?api=1&query=-34.373027,-58.751614'),
  ('Reserva Natural Municipal de Tigre', 'Norte', '', array[-34.393692, -58.621903],
   'https://www.google.com/maps/search/?api=1&query=-34.393692,-58.621903'),
  ('Parque Nacional Ciervo de los Pantanos (ex Otamendi)', 'Norte', '', array[-34.226671, -58.897270],
   'https://www.google.com/maps/search/?api=1&query=-34.226671,-58.897270'),
  ('Reserva Urbana El Corredor (San Miguel)', 'Norte', '', array[-34.568206, -58.676818],
   'https://www.google.com/maps/search/?api=1&query=-34.568206,-58.676818'),
  -- Laferrere: opción A (espacio comunitario). Opción B alternativa (reserva ecológica municipal):
  -- coordenadas -34.728359, -58.600202
  ('Espacio natural Laferrere', 'Oeste', '', array[-34.733583, -58.593437],
   'https://www.google.com/maps/search/?api=1&query=-34.733583,-58.593437');
