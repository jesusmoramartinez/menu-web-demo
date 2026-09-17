-- ============================================================================
-- Fase 1 · Tenant DEMO: seed determinista y reset
--   · Ids y tokens fijos para que los links de la landing (/demo/m/demo-mesa-04)
--     sobrevivan a cada reset.
--   · seed_demo() borra y recrea el restaurante demo completo (menú, mesas,
--     pedidos de muestra). reset_demo() es la versión pública (botón "Reiniciar demo"
--     y cron horario).
-- ============================================================================

-- uuid determinista: prefijo (bloque) + número → 00000000-0000-4000-8000-0000000PPPNN
create or replace function public.demo_uuid(p_block int, p_n int)
returns uuid
language sql immutable
as $$
  select format('00000000-0000-4000-8000-%s', lpad((p_block * 100 + p_n)::text, 12, '0'))::uuid;
$$;

create or replace function public.seed_demo()
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  r_id       uuid := public.demo_uuid(0, 1);
  s_salon    uuid := public.demo_uuid(1, 1);
  s_terraza  uuid := public.demo_uuid(1, 2);
  s_barra    uuid := public.demo_uuid(1, 3);
  c_entradas uuid := public.demo_uuid(2, 1);
  c_pizzas   uuid := public.demo_uuid(2, 2);
  c_bebidas  uuid := public.demo_uuid(2, 3);
  c_postres  uuid := public.demo_uuid(2, 4);
  img        text := 'https://images.unsplash.com/%s?auto=format&fit=crop&w=600&q=70';
  v_sess     uuid;
  v_order    uuid;
  v_item     record;
begin
  -- Idempotente: borra cualquier demo previa (cascade limpia todo)
  delete from public.restaurants where id = r_id or is_demo;

  insert into public.restaurants (id, slug, name, tagline, currency, locale, is_demo, theme)
  values (r_id, 'demo', 'Pizzería Don Remolo', 'Horno de leña desde 1987', 'ARS', 'es-AR', true, '{"brand": "#f97316"}');

  -- Staff demo (si los usuarios existen en auth; se crean en Fase 3)
  insert into public.staff (id, restaurant_id, role, display_name)
  select u.id, r_id,
         case u.email when 'admin@demo.local' then 'admin'::public.staff_role
                      when 'cocina@demo.local' then 'kitchen'::public.staff_role
                      else 'waiter'::public.staff_role end,
         case u.email when 'admin@demo.local' then 'Dueña Demo'
                      when 'cocina@demo.local' then 'Cocina Demo'
                      else 'Mozo Demo' end
  from auth.users u
  where u.email in ('admin@demo.local', 'mozo@demo.local', 'cocina@demo.local');

  -- Sectores y mesas
  insert into public.sectors (id, restaurant_id, name, sort_order) values
    (s_salon,   r_id, 'Salón',   0),
    (s_terraza, r_id, 'Terraza', 1),
    (s_barra,   r_id, 'Barra',   2);

  insert into public.tables (id, restaurant_id, sector_id, number, token)
  select public.demo_uuid(3, n), r_id,
         case when n <= 8 then s_salon when n <= 11 then s_terraza else s_barra end,
         n, 'demo-mesa-' || lpad(n::text, 2, '0')
  from generate_series(1, 12) as n;

  -- Categorías
  insert into public.categories (id, restaurant_id, name, emoji, sort_order) values
    (c_entradas, r_id, 'Entradas', '🥖', 0),
    (c_pizzas,   r_id, 'Pizzas',   '🍕', 1),
    (c_bebidas,  r_id, 'Bebidas',  '🥤', 2),
    (c_postres,  r_id, 'Postres',  '🍮', 3);

  -- Platos (precios en centavos)
  insert into public.menu_items (id, restaurant_id, category_id, name, description, price, image_url, tags, sort_order) values
    (public.demo_uuid(4, 1),  r_id, c_entradas, 'Provoleta a la Parrilla',       'Queso provolone fundido con orégano y aceite de oliva.',                    650000, format(img, 'photo-1541014741259-de529411b96a'), '{Vegetariano}', 0),
    (public.demo_uuid(4, 2),  r_id, c_entradas, 'Empanadas de Carne (x3)',       'Cortadas a cuchillo, con huevo y aceituna. Al horno de barro.',            540000, format(img, 'photo-1601050690597-df0568f70950'), '{}', 1),
    (public.demo_uuid(4, 3),  r_id, c_entradas, 'Bruschettas Caprese',           'Pan de campo tostado, tomate cherry, mozzarella fresca y albahaca.',        590000, format(img, 'photo-1572695157366-5e585ab2b69f'), '{Vegetariano}', 2),
    (public.demo_uuid(4, 4),  r_id, c_entradas, 'Rabas a la Romana',             'Aros de calamar rebozados, con alioli casero y limón.',                     890000, format(img, 'photo-1599487488170-d11ec9c172f0'), '{}', 3),
    (public.demo_uuid(4, 5),  r_id, c_pizzas,   'Muzzarella Clásica',            'Salsa de tomate, muzzarella, aceitunas verdes y orégano.',                  980000, format(img, 'photo-1574071318508-1cdbab80d002'), '{Popular,Vegetariano}', 0),
    (public.demo_uuid(4, 6),  r_id, c_pizzas,   'Napolitana Don Remolo',         'Muzzarella, rodajas de tomate, ajo confitado y albahaca fresca.',          1120000, format(img, 'photo-1604068549290-dea0e4a305ca'), '{Popular}', 1),
    (public.demo_uuid(4, 7),  r_id, c_pizzas,   'Fugazzeta Rellena',             'Doble masa rellena de muzzarella, cubierta de cebolla caramelizada.',      1250000, format(img, 'photo-1513104890138-7c749659a591'), '{Vegetariano}', 2),
    (public.demo_uuid(4, 8),  r_id, c_pizzas,   'Calabresa Picante',             'Longaniza calabresa, morrones asados y un toque de chili.',                1290000, format(img, 'photo-1628840042765-356cda07504e'), '{Picante}', 3),
    (public.demo_uuid(4, 9),  r_id, c_pizzas,   'Cuatro Quesos',                 'Muzzarella, roquefort, provolone y parmesano con nueces.',                 1340000, format(img, 'photo-1565299624946-b28f40a0ae38'), '{Vegetariano}', 4),
    (public.demo_uuid(4, 10), r_id, c_pizzas,   'Rúcula y Jamón Crudo',          'Base blanca, jamón crudo, rúcula fresca y escamas de parmesano.',          1420000, format(img, 'photo-1595854341625-f33ee10dbf94'), '{Chef}', 5),
    (public.demo_uuid(4, 11), r_id, c_bebidas,  'Limonada con Menta y Jengibre', 'Preparada al momento.',                                                     480000, format(img, 'photo-1523677011781-c91d1bbe2f9e'), '{"Sin alcohol"}', 0),
    (public.demo_uuid(4, 12), r_id, c_bebidas,  'Cerveza Artesanal IPA',         'Pinta de 500 ml, elaborada en la ciudad.',                                  450000, format(img, 'photo-1608270586620-248524c67de9'), '{}', 1),
    (public.demo_uuid(4, 13), r_id, c_bebidas,  'Gaseosa Línea Coca-Cola',       'Botella de 500 ml.',                                                        280000, format(img, 'photo-1554866585-cd94860890b7'), '{}', 2),
    (public.demo_uuid(4, 14), r_id, c_bebidas,  'Copa de Malbec',                'Malbec mendocino de bodega boutique.',                                      520000, format(img, 'photo-1510812431401-41d2bd2722f3'), '{}', 3),
    (public.demo_uuid(4, 15), r_id, c_bebidas,  'Agua Mineral',                  'Con o sin gas, 500 ml.',                                                    220000, format(img, 'photo-1548839140-29a749e1cf4d'), '{"Sin alcohol"}', 4),
    (public.demo_uuid(4, 16), r_id, c_postres,  'Tiramisú de la Nonna',          'Receta original italiana con café espresso y mascarpone.',                  580000, format(img, 'photo-1571877227200-a0d98ea607e9'), '{Popular}', 0),
    (public.demo_uuid(4, 17), r_id, c_postres,  'Flan Casero con Dulce de Leche','Flan de huevo con dulce de leche y crema batida.',                          460000, format(img, 'photo-1624353365286-3f8d62daad51'), '{}', 1),
    (public.demo_uuid(4, 18), r_id, c_postres,  'Volcán de Chocolate',           'Bizcocho tibio con centro líquido y helado de vainilla.',                   640000, format(img, 'photo-1606313564200-e75d5e30476c'), '{Chef}', 2),
    (public.demo_uuid(4, 19), r_id, c_postres,  'Panna Cotta de Frutos Rojos',   'Suave crema italiana con coulis de frutos rojos.',                          520000, format(img, 'photo-1488477181946-6428a0291777'), '{}', 3);

  -- Variantes: Tamaño (obligatorio, único) y Extras (múltiple, máx 3) para las pizzas
  for v_item in select n from generate_series(5, 10) as n loop
    insert into public.option_groups (id, restaurant_id, menu_item_id, name, selection, required, min_select, max_select, sort_order) values
      (public.demo_uuid(5, v_item.n), r_id, public.demo_uuid(4, v_item.n), 'Tamaño', 'single',   true,  1, 1,    0),
      (public.demo_uuid(6, v_item.n), r_id, public.demo_uuid(4, v_item.n), 'Extras', 'multiple', false, 0, 3,    1);
    insert into public.options (restaurant_id, group_id, name, price_delta, sort_order) values
      (r_id, public.demo_uuid(5, v_item.n), 'Grande (8 porciones)',  0,       0),
      (r_id, public.demo_uuid(5, v_item.n), 'Chica (4 porciones)',  -300000,  1),
      (r_id, public.demo_uuid(6, v_item.n), 'Extra muzzarella',      150000,  0),
      (r_id, public.demo_uuid(6, v_item.n), 'Huevo',                  80000,  1),
      (r_id, public.demo_uuid(6, v_item.n), 'Jamón',                 120000,  2),
      (r_id, public.demo_uuid(6, v_item.n), 'Aceitunas',              50000,  3);
  end loop;

  -- Gaseosa: sabor obligatorio · Limonada: tamaño
  insert into public.option_groups (id, restaurant_id, menu_item_id, name, selection, required, min_select, max_select, sort_order) values
    (public.demo_uuid(5, 13), r_id, public.demo_uuid(4, 13), 'Sabor',  'single', true, 1, 1, 0),
    (public.demo_uuid(5, 11), r_id, public.demo_uuid(4, 11), 'Tamaño', 'single', true, 1, 1, 0);
  insert into public.options (restaurant_id, group_id, name, price_delta, sort_order) values
    (r_id, public.demo_uuid(5, 13), 'Regular', 0, 0),
    (r_id, public.demo_uuid(5, 13), 'Zero',    0, 1),
    (r_id, public.demo_uuid(5, 13), 'Light',   0, 2),
    (r_id, public.demo_uuid(5, 11), 'Jarra 1 L', 0,       0),
    (r_id, public.demo_uuid(5, 11), 'Vaso',      -250000, 1);

  -- ── Actividad de muestra ────────────────────────────────────────────────
  -- Mesa 2: en cocina hace 12 min
  insert into public.table_sessions (restaurant_id, table_id, opened_at)
  values (r_id, public.demo_uuid(3, 2), now() - interval '20 minutes') returning id into v_sess;
  insert into public.orders (restaurant_id, table_id, session_id, status, created_at, sent_to_kitchen_at)
  values (r_id, public.demo_uuid(3, 2), v_sess, 'kitchen', now() - interval '14 minutes', now() - interval '12 minutes')
  returning id into v_order;
  insert into public.order_items (restaurant_id, order_id, menu_item_id, name_snapshot, unit_price_snapshot, qty, notes, selected_options, sort_order)
  select r_id, v_order, mi.id, mi.name, mi.price, x.qty, x.notes, x.opts, x.pos
  from (values
    (public.demo_uuid(4, 6),  1, 'Sin ajo, por favor', '[{"group_name":"Tamaño","option_name":"Grande (8 porciones)","price_delta":0}]'::jsonb, 1),
    (public.demo_uuid(4, 12), 2, '', '[]'::jsonb, 2),
    (public.demo_uuid(4, 1),  1, '', '[]'::jsonb, 3)
  ) as x(item_id, qty, notes, opts, pos)
  join public.menu_items mi on mi.id = x.item_id;

  -- Mesa 7: en cocina hace 4 min, con un extra
  insert into public.table_sessions (restaurant_id, table_id, opened_at)
  values (r_id, public.demo_uuid(3, 7), now() - interval '10 minutes') returning id into v_sess;
  insert into public.orders (restaurant_id, table_id, session_id, status, created_at, sent_to_kitchen_at)
  values (r_id, public.demo_uuid(3, 7), v_sess, 'kitchen', now() - interval '6 minutes', now() - interval '4 minutes')
  returning id into v_order;
  insert into public.order_items (restaurant_id, order_id, menu_item_id, name_snapshot, unit_price_snapshot, qty, notes, selected_options, sort_order)
  select r_id, v_order, mi.id, mi.name, mi.price + x.delta, x.qty, x.notes, x.opts, x.pos
  from (values
    (public.demo_uuid(4, 7),  0,     1, '', '[{"group_name":"Tamaño","option_name":"Grande (8 porciones)","price_delta":0}]'::jsonb, 1),
    (public.demo_uuid(4, 8),  80000, 1, 'Bien picante 🔥', '[{"group_name":"Tamaño","option_name":"Grande (8 porciones)","price_delta":0},{"group_name":"Extras","option_name":"Huevo","price_delta":80000}]'::jsonb, 2),
    (public.demo_uuid(4, 11), 0,     1, '', '[{"group_name":"Tamaño","option_name":"Jarra 1 L","price_delta":0}]'::jsonb, 3),
    (public.demo_uuid(4, 18), 0,     2, 'Uno sin helado', '[]'::jsonb, 4)
  ) as x(item_id, delta, qty, notes, opts, pos)
  join public.menu_items mi on mi.id = x.item_id;

  -- Mesa 11: pendiente de revisión del mozo
  insert into public.table_sessions (restaurant_id, table_id, opened_at)
  values (r_id, public.demo_uuid(3, 11), now() - interval '5 minutes') returning id into v_sess;
  insert into public.orders (restaurant_id, table_id, session_id, status, created_at)
  values (r_id, public.demo_uuid(3, 11), v_sess, 'pending', now() - interval '2 minutes')
  returning id into v_order;
  insert into public.order_items (restaurant_id, order_id, menu_item_id, name_snapshot, unit_price_snapshot, qty, notes, selected_options, sort_order)
  select r_id, v_order, mi.id, mi.name, mi.price, x.qty, x.notes, x.opts, x.pos
  from (values
    (public.demo_uuid(4, 2),  2, 'Una porción sin aceitunas', '[]'::jsonb, 1),
    (public.demo_uuid(4, 5),  1, '', '[{"group_name":"Tamaño","option_name":"Grande (8 porciones)","price_delta":0}]'::jsonb, 2),
    (public.demo_uuid(4, 13), 3, 'Dos Zero y una regular', '[{"group_name":"Sabor","option_name":"Zero","price_delta":0}]'::jsonb, 3)
  ) as x(item_id, qty, notes, opts, pos)
  join public.menu_items mi on mi.id = x.item_id;

  -- Mesa 9: pidió la cuenta hace 3 min
  insert into public.table_sessions (restaurant_id, table_id, status, opened_at)
  values (r_id, public.demo_uuid(3, 9), 'bill_requested', now() - interval '40 minutes') returning id into v_sess;
  insert into public.orders (restaurant_id, table_id, session_id, status, created_at, sent_to_kitchen_at, ready_at, delivered_at)
  values (r_id, public.demo_uuid(3, 9), v_sess, 'delivered', now() - interval '35 minutes', now() - interval '33 minutes', now() - interval '20 minutes', now() - interval '18 minutes')
  returning id into v_order;
  insert into public.order_items (restaurant_id, order_id, menu_item_id, name_snapshot, unit_price_snapshot, qty, notes, selected_options, sort_order)
  select r_id, v_order, mi.id, mi.name, mi.price, x.qty, '', x.opts, x.pos
  from (values
    (public.demo_uuid(4, 9),  1, '[{"group_name":"Tamaño","option_name":"Grande (8 porciones)","price_delta":0}]'::jsonb, 1),
    (public.demo_uuid(4, 14), 2, '[]'::jsonb, 2)
  ) as x(item_id, qty, opts, pos)
  join public.menu_items mi on mi.id = x.item_id;
  insert into public.alerts (restaurant_id, table_id, session_id, type, created_at)
  values (r_id, public.demo_uuid(3, 9), v_sess, 'bill', now() - interval '3 minutes');
end;
$$;

revoke execute on function public.seed_demo() from public, anon, authenticated;

-- Pública: botón "Reiniciar demo" y cron horario
create or replace function public.reset_demo()
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  perform public.seed_demo();
end;
$$;
grant execute on function public.reset_demo() to anon, authenticated;
