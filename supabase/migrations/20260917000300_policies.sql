-- ============================================================================
-- Fase 1 · Row Level Security
--   Reglas:
--   · Menú (restaurants, categories, menu_items, option_groups, options): lectura pública.
--   · Mesas, pedidos, alertas, sesiones: sólo staff del restaurante (can_operate).
--     El cliente anónimo opera vía RPC (token de mesa / uuid de sesión).
--   · Escrituras de configuración: owner/admin (can_manage).
--   · Tenant demo (is_demo): can_operate/can_manage son verdaderas para cualquiera,
--     así los prospectos prueban mozo, cocina y admin sin cuenta. Se resetea por cron.
-- ============================================================================

alter table public.restaurants        enable row level security;
alter table public.sectors            enable row level security;
alter table public.tables             enable row level security;
alter table public.staff              enable row level security;
alter table public.staff_invites      enable row level security;
alter table public.waiter_assignments enable row level security;
alter table public.categories         enable row level security;
alter table public.menu_items         enable row level security;
alter table public.option_groups      enable row level security;
alter table public.options            enable row level security;
alter table public.table_sessions     enable row level security;
alter table public.orders             enable row level security;
alter table public.order_items        enable row level security;
alter table public.alerts             enable row level security;

-- ----------------------------------------------------------------------------
-- restaurants
-- ----------------------------------------------------------------------------
create policy "restaurants_select_public" on public.restaurants
  for select using (true);
create policy "restaurants_update_manager" on public.restaurants
  for update using (public.can_manage(id)) with check (public.can_manage(id));
-- insert: sólo vía create_restaurant() (security definer). delete: nadie por ahora.

-- ----------------------------------------------------------------------------
-- Menú público, editable por gestores
-- ----------------------------------------------------------------------------
create policy "categories_select_public" on public.categories
  for select using (true);
create policy "categories_write_manager" on public.categories
  for all using (public.can_manage(restaurant_id)) with check (public.can_manage(restaurant_id));

create policy "menu_items_select_public" on public.menu_items
  for select using (true);
create policy "menu_items_write_manager" on public.menu_items
  for all using (public.can_manage(restaurant_id)) with check (public.can_manage(restaurant_id));

create policy "option_groups_select_public" on public.option_groups
  for select using (true);
create policy "option_groups_write_manager" on public.option_groups
  for all using (public.can_manage(restaurant_id)) with check (public.can_manage(restaurant_id));

create policy "options_select_public" on public.options
  for select using (true);
create policy "options_write_manager" on public.options
  for all using (public.can_manage(restaurant_id)) with check (public.can_manage(restaurant_id));

-- ----------------------------------------------------------------------------
-- Sectores y mesas: lectura para staff, escritura para gestores
-- ----------------------------------------------------------------------------
create policy "sectors_select_public" on public.sectors
  for select using (true);
create policy "sectors_write_manager" on public.sectors
  for all using (public.can_manage(restaurant_id)) with check (public.can_manage(restaurant_id));

create policy "tables_select_staff" on public.tables
  for select using (public.can_operate(restaurant_id));
create policy "tables_write_manager" on public.tables
  for all using (public.can_manage(restaurant_id)) with check (public.can_manage(restaurant_id));

-- ----------------------------------------------------------------------------
-- Staff, invitaciones y asignaciones
-- ----------------------------------------------------------------------------
create policy "staff_select_same_restaurant" on public.staff
  for select using (public.can_operate(restaurant_id) or id = auth.uid());
create policy "staff_update_manager" on public.staff
  for update using (public.can_manage(restaurant_id)) with check (public.can_manage(restaurant_id));
create policy "staff_delete_manager" on public.staff
  for delete using (public.can_manage(restaurant_id) and id <> auth.uid());
-- insert: sólo vía join_restaurant() / create_restaurant().

create policy "staff_invites_manager" on public.staff_invites
  for all using (public.can_manage(restaurant_id)) with check (public.can_manage(restaurant_id));

create policy "waiter_assignments_select_staff" on public.waiter_assignments
  for select using (public.can_operate(restaurant_id));
create policy "waiter_assignments_write_manager" on public.waiter_assignments
  for all using (public.can_manage(restaurant_id)) with check (public.can_manage(restaurant_id));

-- ----------------------------------------------------------------------------
-- Operación: sesiones, pedidos, ítems, alertas
-- ----------------------------------------------------------------------------
create policy "table_sessions_staff" on public.table_sessions
  for select using (public.can_operate(restaurant_id));
create policy "table_sessions_insert_staff" on public.table_sessions
  for insert with check (public.can_operate(restaurant_id));
create policy "table_sessions_update_staff" on public.table_sessions
  for update using (public.can_operate(restaurant_id)) with check (public.can_operate(restaurant_id));
create policy "table_sessions_delete_manager" on public.table_sessions
  for delete using (public.can_manage(restaurant_id));

create policy "orders_select_staff" on public.orders
  for select using (public.can_operate(restaurant_id));
create policy "orders_insert_staff" on public.orders
  for insert with check (public.can_operate(restaurant_id));
create policy "orders_update_staff" on public.orders
  for update using (public.can_operate(restaurant_id)) with check (public.can_operate(restaurant_id));
create policy "orders_delete_manager" on public.orders
  for delete using (public.can_manage(restaurant_id));

create policy "order_items_select_staff" on public.order_items
  for select using (public.can_operate(restaurant_id));
create policy "order_items_insert_staff" on public.order_items
  for insert with check (public.can_operate(restaurant_id));
create policy "order_items_update_staff" on public.order_items
  for update using (public.can_operate(restaurant_id)) with check (public.can_operate(restaurant_id));
create policy "order_items_delete_staff" on public.order_items
  for delete using (public.can_operate(restaurant_id));

create policy "alerts_select_staff" on public.alerts
  for select using (public.can_operate(restaurant_id));
create policy "alerts_insert_staff" on public.alerts
  for insert with check (public.can_operate(restaurant_id));
create policy "alerts_update_staff" on public.alerts
  for update using (public.can_operate(restaurant_id)) with check (public.can_operate(restaurant_id));
create policy "alerts_delete_manager" on public.alerts
  for delete using (public.can_manage(restaurant_id));

-- ----------------------------------------------------------------------------
-- Realtime: el staff se suscribe a cambios filtrados por restaurant_id
-- (la publicación respeta las políticas de select de arriba).
-- ----------------------------------------------------------------------------
alter publication supabase_realtime add table
  public.orders, public.order_items, public.alerts, public.table_sessions, public.menu_items;
