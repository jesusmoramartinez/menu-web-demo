-- ============================================================================
-- Fase 1 · Esquema base del SaaS "Menú Digital"
-- Convenciones:
--   · Todos los importes en CENTAVOS (integer).
--   · Toda tabla de negocio lleva restaurant_id (tenant) para RLS y realtime.
--   · Consistencia de tenant entre tablas relacionadas con FKs compuestas.
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
create type public.staff_role as enum ('owner', 'admin', 'waiter', 'kitchen');
create type public.order_status as enum ('pending', 'kitchen', 'ready', 'delivered', 'cancelled');
create type public.alert_type as enum ('waiter', 'bill');
create type public.session_status as enum ('open', 'bill_requested', 'closed');
create type public.option_selection as enum ('single', 'multiple');

-- ----------------------------------------------------------------------------
-- Helpers de generación de códigos
-- ----------------------------------------------------------------------------
-- Alfabeto sin caracteres ambiguos (0/O, 1/l/I).
create or replace function public.random_code(len int default 8, alphabet text default 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789')
returns text
language sql
volatile
as $$
  select string_agg(substr(alphabet, 1 + (get_byte(extensions.gen_random_bytes(1), 0) % length(alphabet)), 1), '')
  from generate_series(1, len);
$$;

-- ----------------------------------------------------------------------------
-- restaurants (tenant)
-- ----------------------------------------------------------------------------
create table public.restaurants (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique
              check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 40),
  name        text not null check (char_length(name) between 2 and 80),
  tagline     text,
  logo_url    text,
  currency    text not null default 'ARS' check (currency ~ '^[A-Z]{3}$'),
  locale      text not null default 'es-AR',
  theme       jsonb not null default '{}'::jsonb,
  is_demo     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- sectors · tables
-- ----------------------------------------------------------------------------
create table public.sectors (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name          text not null check (char_length(name) between 1 and 40),
  sort_order    int not null default 0,
  unique (restaurant_id, name),
  unique (id, restaurant_id)
);

create table public.tables (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  sector_id     uuid,
  number        int not null check (number > 0),
  label         text,
  -- Token que va en el QR. Minúsculas para URLs amigables.
  token         text not null unique default public.random_code(12, 'abcdefghijkmnpqrstuvwxyz23456789'),
  is_active     boolean not null default true,
  unique (restaurant_id, number),
  unique (id, restaurant_id),
  foreign key (sector_id, restaurant_id) references public.sectors(id, restaurant_id) on delete set null (sector_id)
);

-- ----------------------------------------------------------------------------
-- staff · staff_invites · waiter_assignments
-- ----------------------------------------------------------------------------
create table public.staff (
  id            uuid primary key references auth.users(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  role          public.staff_role not null default 'waiter',
  display_name  text not null check (char_length(display_name) between 1 and 60),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (id, restaurant_id)
);
create index staff_restaurant_idx on public.staff (restaurant_id);

create table public.staff_invites (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  email         text,                              -- opcional: restringe quién puede canjearlo
  role          public.staff_role not null default 'waiter' check (role <> 'owner'),
  code          text not null unique default public.random_code(8),
  created_by    uuid references auth.users(id) on delete set null,
  used_by       uuid references auth.users(id) on delete set null,
  used_at       timestamptz,
  expires_at    timestamptz not null default now() + interval '7 days',
  created_at    timestamptz not null default now()
);

create table public.waiter_assignments (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  staff_id      uuid not null,
  sector_id     uuid,
  table_id      uuid,
  check ((sector_id is null) <> (table_id is null)),   -- exactamente uno
  unique (staff_id, sector_id),
  unique (staff_id, table_id),
  foreign key (staff_id, restaurant_id)  references public.staff(id, restaurant_id)   on delete cascade,
  foreign key (sector_id, restaurant_id) references public.sectors(id, restaurant_id) on delete cascade,
  foreign key (table_id, restaurant_id)  references public.tables(id, restaurant_id)  on delete cascade
);

-- ----------------------------------------------------------------------------
-- Menú: categories · menu_items · option_groups · options
-- ----------------------------------------------------------------------------
create table public.categories (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name          text not null check (char_length(name) between 1 and 40),
  emoji         text,
  sort_order    int not null default 0,
  is_active     boolean not null default true,
  unique (id, restaurant_id)
);

create table public.menu_items (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid not null references public.restaurants(id) on delete cascade,
  category_id    uuid not null,
  name           text not null check (char_length(name) between 1 and 80),
  description    text not null default '',
  price          integer not null check (price >= 0),           -- centavos
  image_url      text,
  tags           text[] not null default '{}',
  is_available   boolean not null default true,                 -- visible en el menú
  sold_out_until date,                                          -- "agotado hoy": se limpia solo al día siguiente
  sort_order     int not null default 0,
  created_at     timestamptz not null default now(),
  unique (id, restaurant_id),
  foreign key (category_id, restaurant_id) references public.categories(id, restaurant_id) on delete cascade
);
create index menu_items_restaurant_idx on public.menu_items (restaurant_id, category_id, sort_order);

create table public.option_groups (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  menu_item_id  uuid not null,
  name          text not null check (char_length(name) between 1 and 40),
  selection     public.option_selection not null default 'single',
  required      boolean not null default false,
  min_select    int not null default 0 check (min_select >= 0),
  max_select    int check (max_select is null or max_select >= 1),
  sort_order    int not null default 0,
  unique (id, restaurant_id),
  foreign key (menu_item_id, restaurant_id) references public.menu_items(id, restaurant_id) on delete cascade
);
create index option_groups_item_idx on public.option_groups (menu_item_id);

create table public.options (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  group_id      uuid not null,
  name          text not null check (char_length(name) between 1 and 40),
  price_delta   integer not null default 0,                     -- centavos, puede ser negativo
  is_available  boolean not null default true,
  sort_order    int not null default 0,
  foreign key (group_id, restaurant_id) references public.option_groups(id, restaurant_id) on delete cascade
);
create index options_group_idx on public.options (group_id);

-- ----------------------------------------------------------------------------
-- Operación: table_sessions · orders · order_items · alerts
-- ----------------------------------------------------------------------------
create table public.table_sessions (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  table_id      uuid not null,
  status        public.session_status not null default 'open',
  opened_at     timestamptz not null default now(),
  closed_at     timestamptz,
  closed_by     uuid references auth.users(id) on delete set null,
  unique (id, restaurant_id),
  foreign key (table_id, restaurant_id) references public.tables(id, restaurant_id) on delete cascade
);
-- Una sola sesión abierta por mesa
create unique index table_sessions_one_open_idx on public.table_sessions (table_id) where status <> 'closed';
create index table_sessions_restaurant_idx on public.table_sessions (restaurant_id, status);

create table public.orders (
  id                 uuid primary key default gen_random_uuid(),
  restaurant_id      uuid not null references public.restaurants(id) on delete cascade,
  table_id           uuid not null,
  session_id         uuid not null,
  status             public.order_status not null default 'pending',
  total              integer not null default 0 check (total >= 0),   -- mantenido por trigger
  created_at         timestamptz not null default now(),
  sent_to_kitchen_at timestamptz,
  ready_at           timestamptz,
  delivered_at       timestamptz,
  handled_by         uuid references auth.users(id) on delete set null,
  unique (id, restaurant_id),
  foreign key (table_id, restaurant_id)   references public.tables(id, restaurant_id)         on delete cascade,
  foreign key (session_id, restaurant_id) references public.table_sessions(id, restaurant_id) on delete cascade
);
create index orders_restaurant_status_idx on public.orders (restaurant_id, status, created_at);
create index orders_session_idx on public.orders (session_id);

create table public.order_items (
  id                  uuid primary key default gen_random_uuid(),
  restaurant_id       uuid not null references public.restaurants(id) on delete cascade,
  order_id            uuid not null,
  menu_item_id        uuid references public.menu_items(id) on delete set null,
  name_snapshot       text not null,
  unit_price_snapshot integer not null check (unit_price_snapshot >= 0),   -- base + opciones, por unidad
  qty                 integer not null check (qty between 1 and 99),
  notes               text not null default '',
  selected_options    jsonb not null default '[]'::jsonb,                  -- [{group_name, option_name, price_delta}]
  line_total          integer generated always as (unit_price_snapshot * qty) stored,
  sort_order          int not null default 0,
  foreign key (order_id, restaurant_id) references public.orders(id, restaurant_id) on delete cascade
);
create index order_items_order_idx on public.order_items (order_id);

create table public.alerts (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  table_id      uuid not null,
  session_id    uuid,
  type          public.alert_type not null,
  created_at    timestamptz not null default now(),
  resolved_at   timestamptz,
  resolved_by   uuid references auth.users(id) on delete set null,
  foreign key (table_id, restaurant_id)   references public.tables(id, restaurant_id)         on delete cascade,
  foreign key (session_id, restaurant_id) references public.table_sessions(id, restaurant_id) on delete cascade
);
-- Una sola alerta abierta por mesa y tipo
create unique index alerts_one_open_idx on public.alerts (table_id, type) where resolved_at is null;
create index alerts_open_restaurant_idx on public.alerts (restaurant_id) where resolved_at is null;

-- ----------------------------------------------------------------------------
-- Triggers de consistencia
-- ----------------------------------------------------------------------------
-- orders.total = suma de line_total de sus ítems
create or replace function public.recalc_order_total()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
begin
  if tg_op = 'DELETE' then
    v_order_id := old.order_id;
  else
    v_order_id := new.order_id;
  end if;
  update public.orders o
     set total = coalesce((select sum(oi.line_total) from public.order_items oi where oi.order_id = v_order_id), 0)
   where o.id = v_order_id;
  return null;
end;
$$;

create trigger order_items_recalc_total
after insert or update or delete on public.order_items
for each row execute function public.recalc_order_total();

-- Timestamps de estado del pedido (se setean solos al cambiar status)
create or replace function public.stamp_order_status()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'kitchen'   and new.sent_to_kitchen_at is null then new.sent_to_kitchen_at := now(); end if;
    if new.status = 'ready'     and new.ready_at is null          then new.ready_at := now();          end if;
    if new.status = 'delivered' and new.delivered_at is null      then new.delivered_at := now();      end if;
  end if;
  return new;
end;
$$;

create trigger orders_stamp_status
before update on public.orders
for each row execute function public.stamp_order_status();

-- Cerrar sesión: sella closed_at
create or replace function public.stamp_session_close()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'closed' and old.status <> 'closed' and new.closed_at is null then
    new.closed_at := now();
  end if;
  return new;
end;
$$;

create trigger table_sessions_stamp_close
before update on public.table_sessions
for each row execute function public.stamp_session_close();
