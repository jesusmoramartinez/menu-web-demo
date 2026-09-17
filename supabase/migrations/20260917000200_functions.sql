-- ============================================================================
-- Fase 1 · Funciones: helpers de autorización y RPCs
--   · Helpers `security definer` para evitar recursión de RLS sobre `staff`.
--   · El cliente anónimo NUNCA escribe pedidos/alertas directo: sólo vía RPC
--     con el token de mesa como capacidad. Los precios se recalculan acá.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helpers de identidad del staff
-- ----------------------------------------------------------------------------
create or replace function public.current_restaurant_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select restaurant_id from public.staff where id = auth.uid() and is_active;
$$;

create or replace function public.current_staff_role()
returns public.staff_role
language sql stable security definer
set search_path = public
as $$
  select role from public.staff where id = auth.uid() and is_active;
$$;

create or replace function public.is_manager()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce((select role in ('owner', 'admin') from public.staff where id = auth.uid() and is_active), false);
$$;

-- Staff activo del restaurante, o cualquiera si es el tenant demo (público).
-- Sin security definer para que el planificador pueda inlinearla en las políticas.
create or replace function public.can_operate(p_restaurant_id uuid)
returns boolean
language sql stable
as $$
  select p_restaurant_id = (select public.current_restaurant_id())
      or p_restaurant_id in (select id from public.restaurants where is_demo);
$$;

-- owner/admin del restaurante, o cualquiera si es el tenant demo.
create or replace function public.can_manage(p_restaurant_id uuid)
returns boolean
language sql stable
as $$
  select ((select public.is_manager()) and p_restaurant_id = (select public.current_restaurant_id()))
      or p_restaurant_id in (select id from public.restaurants where is_demo);
$$;

-- ----------------------------------------------------------------------------
-- Sesión de mesa (interna)
-- ----------------------------------------------------------------------------
create or replace function public.ensure_open_session(p_restaurant_id uuid, p_table_id uuid)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  select id into v_id from public.table_sessions where table_id = p_table_id and status <> 'closed';
  if v_id is not null then
    return v_id;
  end if;

  insert into public.table_sessions (restaurant_id, table_id)
  values (p_restaurant_id, p_table_id)
  on conflict (table_id) where status <> 'closed' do nothing
  returning id into v_id;

  if v_id is null then -- carrera: otro cliente la abrió al mismo tiempo
    select id into v_id from public.table_sessions where table_id = p_table_id and status <> 'closed';
  end if;
  return v_id;
end;
$$;
revoke execute on function public.ensure_open_session(uuid, uuid) from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- RPC · get_table_by_token(token) → restaurante + mesa + sesión abierta
-- ----------------------------------------------------------------------------
create or replace function public.get_table_by_token(p_token text)
returns jsonb
language sql stable security definer
set search_path = public
as $$
  select jsonb_build_object(
    'restaurant', jsonb_build_object(
      'id', r.id, 'slug', r.slug, 'name', r.name, 'tagline', r.tagline, 'logo_url', r.logo_url,
      'currency', r.currency, 'locale', r.locale, 'theme', r.theme, 'is_demo', r.is_demo
    ),
    'table', jsonb_build_object('id', t.id, 'number', t.number, 'label', t.label, 'sector', s.name),
    'session', (
      select jsonb_build_object('id', ts.id, 'status', ts.status, 'opened_at', ts.opened_at)
      from public.table_sessions ts
      where ts.table_id = t.id and ts.status <> 'closed'
      limit 1
    )
  )
  from public.tables t
  join public.restaurants r on r.id = t.restaurant_id
  left join public.sectors s on s.id = t.sector_id
  where t.token = p_token and t.is_active;
$$;

-- ----------------------------------------------------------------------------
-- RPC · place_order(token, items) → { order_id, session_id, total }
--   items: [{ menu_item_id, qty, notes, option_ids: [uuid] }]
--   Precios y opciones se toman SIEMPRE de la base; el payload sólo elige.
-- ----------------------------------------------------------------------------
create or replace function public.place_order(p_token text, p_items jsonb)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_table      public.tables%rowtype;
  v_menu       public.menu_items%rowtype;
  v_group      public.option_groups%rowtype;
  v_session    uuid;
  v_order      uuid;
  v_item       jsonb;
  v_qty        int;
  v_notes      text;
  v_opt_ids    uuid[];
  v_sel_count  int;
  v_unit       integer;
  v_delta      integer;
  v_selected   jsonb;
  v_pos        int := 0;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_ORDER';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'TOO_MANY_ITEMS';
  end if;

  select * into v_table from public.tables where token = p_token and is_active;
  if not found then
    raise exception 'TABLE_NOT_FOUND';
  end if;

  v_session := public.ensure_open_session(v_table.restaurant_id, v_table.id);

  insert into public.orders (restaurant_id, table_id, session_id)
  values (v_table.restaurant_id, v_table.id, v_session)
  returning id into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_pos   := v_pos + 1;
    v_qty   := coalesce((v_item->>'qty')::int, 1);
    v_notes := left(coalesce(v_item->>'notes', ''), 200);
    if v_qty < 1 or v_qty > 99 then
      raise exception 'INVALID_QTY';
    end if;

    select * into v_menu
    from public.menu_items
    where id = (v_item->>'menu_item_id')::uuid and restaurant_id = v_table.restaurant_id;
    if not found then
      raise exception 'ITEM_NOT_FOUND';
    end if;
    if not v_menu.is_available or (v_menu.sold_out_until is not null and v_menu.sold_out_until >= current_date) then
      raise exception 'ITEM_UNAVAILABLE: %', v_menu.name;
    end if;

    v_opt_ids := coalesce(
      array(select value::uuid from jsonb_array_elements_text(coalesce(v_item->'option_ids', '[]'::jsonb))),
      '{}'::uuid[]
    );

    -- Reglas de cada grupo del plato
    for v_group in select * from public.option_groups g where g.menu_item_id = v_menu.id order by g.sort_order loop
      select count(*) into v_sel_count
      from public.options o
      where o.group_id = v_group.id and o.id = any(v_opt_ids);

      if v_group.required and v_sel_count < greatest(v_group.min_select, 1) then
        raise exception 'OPTION_REQUIRED: %', v_group.name;
      end if;
      if v_sel_count < v_group.min_select then
        raise exception 'OPTION_MIN: %', v_group.name;
      end if;
      if v_group.selection = 'single' and v_sel_count > 1 then
        raise exception 'OPTION_SINGLE: %', v_group.name;
      end if;
      if v_group.max_select is not null and v_sel_count > v_group.max_select then
        raise exception 'OPTION_MAX: %', v_group.name;
      end if;
    end loop;

    -- Toda opción enviada debe ser de este plato y estar disponible
    if exists (
      select 1
      from unnest(v_opt_ids) as u(option_id)
      left join public.options o on o.id = u.option_id
      left join public.option_groups g on g.id = o.group_id and g.menu_item_id = v_menu.id
      where g.id is null or not o.is_available
    ) then
      raise exception 'OPTION_INVALID';
    end if;

    select coalesce(sum(o.price_delta), 0),
           coalesce(jsonb_agg(
             jsonb_build_object('group_name', g.name, 'option_name', o.name, 'price_delta', o.price_delta)
             order by g.sort_order, o.sort_order
           ), '[]'::jsonb)
    into v_delta, v_selected
    from public.options o
    join public.option_groups g on g.id = o.group_id
    where o.id = any(v_opt_ids);

    v_unit := greatest(v_menu.price + v_delta, 0);

    insert into public.order_items
      (restaurant_id, order_id, menu_item_id, name_snapshot, unit_price_snapshot, qty, notes, selected_options, sort_order)
    values
      (v_table.restaurant_id, v_order, v_menu.id, v_menu.name, v_unit, v_qty, v_notes, v_selected, v_pos);
  end loop;

  return jsonb_build_object(
    'order_id', v_order,
    'session_id', v_session,
    'total', (select total from public.orders where id = v_order)
  );
end;
$$;

-- ----------------------------------------------------------------------------
-- RPC · create_alert(token, type) → { alert_id, session_id, created }
--   Idempotente: si ya hay una alerta abierta del mismo tipo, devuelve esa.
-- ----------------------------------------------------------------------------
create or replace function public.create_alert(p_token text, p_type public.alert_type)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_table   public.tables%rowtype;
  v_session uuid;
  v_id      uuid;
  v_created boolean := true;
begin
  select * into v_table from public.tables where token = p_token and is_active;
  if not found then
    raise exception 'TABLE_NOT_FOUND';
  end if;

  v_session := public.ensure_open_session(v_table.restaurant_id, v_table.id);

  insert into public.alerts (restaurant_id, table_id, session_id, type)
  values (v_table.restaurant_id, v_table.id, v_session, p_type)
  on conflict (table_id, type) where resolved_at is null do nothing
  returning id into v_id;

  if v_id is null then
    v_created := false;
    select id into v_id from public.alerts
    where table_id = v_table.id and type = p_type and resolved_at is null;
  end if;

  if p_type = 'bill' then
    update public.table_sessions set status = 'bill_requested' where id = v_session and status = 'open';
  end if;

  return jsonb_build_object('alert_id', v_id, 'session_id', v_session, 'created', v_created);
end;
$$;

-- ----------------------------------------------------------------------------
-- RPC · get_session_state(session_id) → pedidos, ítems, alertas abiertas y total
--   El uuid de sesión es la capacidad: lo conoce quien pidió desde la mesa.
-- ----------------------------------------------------------------------------
create or replace function public.get_session_state(p_session_id uuid)
returns jsonb
language sql stable security definer
set search_path = public
as $$
  select jsonb_build_object(
    'session', jsonb_build_object('id', s.id, 'status', s.status, 'opened_at', s.opened_at, 'closed_at', s.closed_at),
    'table', jsonb_build_object('id', t.id, 'number', t.number, 'label', t.label),
    'orders', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', o.id, 'status', o.status, 'total', o.total, 'created_at', o.created_at,
          'sent_to_kitchen_at', o.sent_to_kitchen_at, 'ready_at', o.ready_at, 'delivered_at', o.delivered_at,
          'items', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'id', oi.id, 'name', oi.name_snapshot, 'qty', oi.qty, 'unit_price', oi.unit_price_snapshot,
                'line_total', oi.line_total, 'notes', oi.notes, 'selected_options', oi.selected_options
              ) order by oi.sort_order
            )
            from public.order_items oi where oi.order_id = o.id
          ), '[]'::jsonb)
        ) order by o.created_at desc
      )
      from public.orders o where o.session_id = s.id
    ), '[]'::jsonb),
    'open_alerts', coalesce((
      select jsonb_agg(jsonb_build_object('id', a.id, 'type', a.type, 'created_at', a.created_at))
      from public.alerts a where a.session_id = s.id and a.resolved_at is null
    ), '[]'::jsonb),
    'total', coalesce((
      select sum(o.total) from public.orders o where o.session_id = s.id and o.status <> 'cancelled'
    ), 0)
  )
  from public.table_sessions s
  join public.tables t on t.id = s.table_id
  where s.id = p_session_id;
$$;

-- ----------------------------------------------------------------------------
-- RPC · join_restaurant(code, display_name) → { restaurant_id, role }
--   Un usuario autenticado canjea un código de invitación y pasa a ser staff.
-- ----------------------------------------------------------------------------
create or replace function public.join_restaurant(p_code text, p_display_name text default null)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_inv   public.staff_invites%rowtype;
  v_email text;
  v_name  text;
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;
  if exists (select 1 from public.staff where id = v_uid) then
    raise exception 'ALREADY_STAFF';
  end if;

  select * into v_inv
  from public.staff_invites
  where code = upper(trim(p_code)) and used_at is null and expires_at > now();
  if not found then
    raise exception 'INVITE_INVALID';
  end if;

  v_email := lower(coalesce(auth.jwt()->>'email', ''));
  if v_inv.email is not null and lower(v_inv.email) <> v_email then
    raise exception 'INVITE_EMAIL_MISMATCH';
  end if;

  v_name := coalesce(
    nullif(trim(p_display_name), ''),
    nullif(auth.jwt()->'user_metadata'->>'name', ''),
    nullif(split_part(v_email, '@', 1), ''),
    'Staff'
  );

  insert into public.staff (id, restaurant_id, role, display_name)
  values (v_uid, v_inv.restaurant_id, v_inv.role, left(v_name, 60));

  update public.staff_invites set used_at = now(), used_by = v_uid where id = v_inv.id;

  return jsonb_build_object('restaurant_id', v_inv.restaurant_id, 'role', v_inv.role);
end;
$$;

-- ----------------------------------------------------------------------------
-- RPC · create_restaurant(name, slug) → { restaurant_id, slug }
--   Alta SaaS: el usuario autenticado queda como owner con datos por defecto.
-- ----------------------------------------------------------------------------
create or replace function public.create_restaurant(p_name text, p_slug text)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_rid  uuid;
  v_slug text := lower(trim(p_slug));
  v_name text;
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;
  if exists (select 1 from public.staff where id = v_uid) then
    raise exception 'ALREADY_STAFF';
  end if;
  if v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or char_length(v_slug) not between 3 and 40 then
    raise exception 'SLUG_INVALID';
  end if;
  if exists (select 1 from public.restaurants where slug = v_slug) then
    raise exception 'SLUG_TAKEN';
  end if;

  insert into public.restaurants (name, slug) values (trim(p_name), v_slug) returning id into v_rid;

  v_name := coalesce(
    nullif(auth.jwt()->'user_metadata'->>'name', ''),
    nullif(split_part(coalesce(auth.jwt()->>'email', ''), '@', 1), ''),
    'Dueño'
  );
  insert into public.staff (id, restaurant_id, role, display_name) values (v_uid, v_rid, 'owner', left(v_name, 60));

  insert into public.sectors (restaurant_id, name, sort_order) values (v_rid, 'Salón', 0);
  insert into public.categories (restaurant_id, name, emoji, sort_order) values
    (v_rid, 'Entradas',    '🥗', 0),
    (v_rid, 'Principales', '🍽️', 1),
    (v_rid, 'Bebidas',     '🥤', 2),
    (v_rid, 'Postres',     '🍮', 3);

  return jsonb_build_object('restaurant_id', v_rid, 'slug', v_slug);
end;
$$;
