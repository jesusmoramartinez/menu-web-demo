# Plan: de prototipo a producto vendible — Menú Digital SaaS

## Contexto

Hoy la app es un **prototipo funcional de una sola pantalla**: tres vistas (cliente / mozo / cocina) que comparten un `useReducer` persistido en `localStorage`. Sirve para demostrar el flujo, pero no se puede vender porque:

- No hay backend: mesa, mozo y cocina tienen que estar en **el mismo navegador**. En un restaurante real son dispositivos distintos.
- No hay identidad: cualquiera que abra la URL ve el panel del mozo y la cocina. No hay login ni roles.
- El menú, los precios y la mesa están **hardcodeados** (`data/menu.js`, `table: 4`). El dueño no puede cambiar nada sin tocar código.
- Es un solo restaurante. Para vender como SaaS hace falta multi-tenant.

Decisiones tomadas con el usuario:

| Decisión | Elección |
|---|---|
| Modelo de negocio | **SaaS multi-restaurante**: una app, una base Supabase, cada restaurante con su `slug` |
| Backend | **Supabase** (ya instalado; `.env.local` con URL y anon key) |
| Lenguaje | **Migrar a TypeScript** ahora |
| Alcance MVP | Núcleo (realtime, login, admin menú/QR) + **sectores de mesas y asignación de mozos** + **panel simple para dueño (precios y "agotado hoy")** + **variantes/extras** + **estado del pedido visible para el cliente** |
| Fuera del MVP | Pagos online, impresión de comandas, facturación de suscripciones (cobro manual al inicio) |

Resultado esperado: una app desplegada donde un restaurante se da de alta, carga su menú, imprime QRs por mesa, y su personal opera desde celulares/tablets distintos en tiempo real; con un tenant `demo` público para mostrar a prospectos.

---

## Mejoras detectadas en el código actual

| Detectado | Mejora | Fase |
|---|---|---|
| `ViewSwitcher` expone mozo/cocina a cualquier visitante | Rutas por rol + auth; el switcher queda sólo en el tenant `demo` | 0, 3 |
| `table: 4` fijo, `setTable` sin UI | Mesa desde la URL del QR: `/r/:slug/m/:tableToken` (token aleatorio, no número adivinable) | 0, 2 |
| Precios y menú en `data/menu.js` | Tablas `categories`, `menu_items`, `option_groups`, `options`; admin edita | 1, 5 |
| Precio calculado en el cliente (`cartTotal`, `total` en `OrderEditModal`) | El servidor recalcula en `place_order` (RPC); el cliente nunca decide precios | 1, 2 |
| `localStorage` como "tiempo real" | Supabase Realtime (`postgres_changes`) para staff; polling corto para el cliente anónimo | 2 |
| Cliente sólo recibe un toast al pedir | Pantalla "Mis pedidos" con estado `Recibido → En cocina → Listo → Entregado` y total de la mesa | 2 |
| No existe la "mesa abierta / cuenta" | `table_sessions`: agrupa pedidos y alertas de una visita; el mozo cierra la mesa | 1, 3 |
| Un solo estado `done` | `ready` (cocina) y `delivered` (mozo) separados; `cancelled` | 1 |
| Sin variantes (pizza chica/grande, extras) | Grupos de opciones por plato; línea de carrito = plato + opciones + notas | 4 |
| Sin "agotado" | `sold_out_until date` (se limpia solo al día siguiente) + `is_available` | 1, 5 |
| `window.confirm` para eliminar | `ConfirmDialog` propio | 0 |
| Modales sin focus trap | `useFocusTrap` + `aria-modal` | 0 |
| Sin sonido en mozo/cocina | Aviso sonoro + vibración al llegar alerta/comanda (desbloqueo con primer gesto) | 6 |
| KDS en tablet se apaga / sale de pantalla completa | Wake Lock API + botón pantalla completa + PWA instalable | 6 |
| Imágenes de Unsplash | Subida a Supabase Storage desde el admin (URL externa sigue permitida) | 5 |
| Moneda ARS hardcodeada | `restaurants.currency` + `formatPrice(amount, currency)`; precios en **centavos** (`integer`) | 0, 1 |
| Sin tests, sin CI, sin typecheck | Vitest + Testing Library, `tsc --noEmit`, GitHub Actions | 0, 6 |
| `useRestaurant` exportado junto al Provider (warning fast-refresh) | Hooks en archivos propios (`hooks/`) | 0 |
| Sin manejo de errores / offline | `ErrorBoundary`, estados de carga (skeletons), banner "sin conexión" | 2 |
| Sin deploy ni docs de operación | Vercel + `supabase/migrations` + `docs/` (alta de restaurante, manual de mozo/cocina) | 6 |

---

## Arquitectura objetivo

### Stack

React 19 + Vite + **TypeScript** + Tailwind 4 + lucide-react (se mantienen) · **react-router v7** (rutas por rol) · **@tanstack/react-query** (estado de servidor, cache, invalidación por realtime) · **@supabase/supabase-js** · **qrcode** (PNG de QR por mesa) · dev: `typescript`, `vitest`, `@testing-library/react`, `jsdom`, `supabase` CLI.

Se mantiene **Context + useReducer sólo para el carrito** (estado local del comensal). Todo lo demás es estado de servidor vía React Query.

### Rutas

```
/                          landing mínima (qué es, "Probar demo", contacto)
/r/:slug/m/:tableToken     CLIENTE (anónimo). Menú, carrito, mis pedidos, llamar mozo, cuenta
/login                     staff: email + contraseña (Supabase Auth)
/registro                  staff nuevo con código de invitación → RPC join_restaurant
/mozo                      MOZO (rol waiter|admin|owner)
/cocina                    COCINA (rol kitchen|admin|owner)
/admin                     ADMIN (rol admin|owner): menú, mesas y sectores, personal, configuración
/demo/*                    igual que arriba pero sobre el tenant `demo`, sin login, con el ViewSwitcher actual
```

El restaurante del staff se deduce de su fila en `staff` (un usuario ↔ un restaurante); el cliente lo deduce del `slug` + `tableToken`.

### Esquema de base (Supabase / Postgres)

Todos los importes en **centavos** (`integer`). Todas las tablas de negocio llevan `restaurant_id` para RLS.

```
restaurants        id, slug UNIQUE, name, tagline, logo_url, currency 'ARS', theme jsonb, join_code, is_demo, created_at
sectors            id, restaurant_id, name, sort_order
tables             id, restaurant_id, sector_id NULL, number, label, token UNIQUE (12 chars aleatorios), is_active
                   UNIQUE(restaurant_id, number)
staff              id = auth.users.id, restaurant_id, role ENUM(owner, admin, waiter, kitchen), display_name, is_active
staff_invites      id, restaurant_id, email, role, code, used_at NULL, expires_at
waiter_assignments staff_id, restaurant_id, sector_id NULL, table_id NULL   CHECK(exactamente uno no nulo)
categories         id, restaurant_id, name, emoji, sort_order, is_active
menu_items         id, restaurant_id, category_id, name, description, price, image_url, tags text[],
                   is_available, sold_out_until date NULL, sort_order
option_groups      id, menu_item_id, name ("Tamaño"), selection ENUM(single, multiple), required, min_select, max_select, sort_order
options            id, group_id, name ("Grande"), price_delta, is_available, sort_order
table_sessions     id, restaurant_id, table_id, status ENUM(open, bill_requested, closed), opened_at, closed_at, closed_by
orders             id, restaurant_id, table_id, session_id, status ENUM(pending, kitchen, ready, delivered, cancelled),
                   total, created_at, sent_to_kitchen_at, ready_at, delivered_at, handled_by NULL
order_items        id, order_id, menu_item_id, name_snapshot, unit_price_snapshot, qty, notes,
                   selected_options jsonb [{group_name, option_name, price_delta}], line_total
alerts             id, restaurant_id, table_id, session_id, type ENUM(waiter, bill), created_at, resolved_at NULL, resolved_by NULL
```

**Funciones SQL (RPC, `SECURITY DEFINER`)** — el cliente anónimo sólo puede escribir a través de ellas:

- `get_table_by_token(token)` → restaurante + mesa + sesión abierta (sin listar mesas).
- `place_order(token, items jsonb)` → valida mesa, **recalcula precios y opciones desde la DB**, rechaza agotados, abre sesión si no hay, inserta `orders` + `order_items`. Devuelve `order_id` + `session_id`.
- `create_alert(token, type)` → dedup por (sesión, tipo) sin resolver.
- `get_session_state(session_id)` → pedidos con items + estado + total de la sesión (para "Mis pedidos" / "La cuenta").
- `join_restaurant(code)` → crea la fila `staff` para `auth.uid()` a partir de `staff_invites`.
- `create_restaurant(name, slug)` → alta SaaS: restaurante + `staff` owner + sector y categorías por defecto.
- `reset_demo()` → restaura el tenant demo (programada con `pg_cron` cada hora).

**RLS (resumen):**
- Lectura pública (anon): `restaurants` (campos públicos), `categories`, `menu_items`, `option_groups`, `options`. Mesas y pedidos **no** son legibles por anon salvo vía RPC.
- Staff autenticado: `restaurant_id = current_restaurant_id()` (función helper que lee `staff` por `auth.uid()`). `waiter`/`kitchen` pueden `update` en `orders`, `alerts`, `table_sessions`; `admin`/`owner` tienen CRUD en menú, mesas, sectores, staff, invites, configuración.
- Tenant demo: `is_demo = true` habilita a anon leer/actualizar `orders`/`alerts` de ese restaurante (para que un prospecto pruebe mozo y cocina sin cuenta). Se resetea por cron.

**Realtime:** staff se suscribe a `postgres_changes` en `orders`, `order_items`, `alerts`, `table_sessions` filtradas por `restaurant_id`; cada evento invalida la query de React Query correspondiente. Cliente anónimo: `refetchInterval` de 8 s sobre `get_session_state` + refetch al volver a foco (evita RLS anónimo sobre realtime).

### Estructura de carpetas objetivo

```
supabase/
  migrations/           SQL versionado (schema, RLS, funciones, cron)
  seed.sql              tenant demo (menú Don Remolo actual + mesas + staff demo)
src/
  app/                  router.tsx, providers.tsx (QueryClient, Auth), layouts por rol, guards
  lib/                  supabase.ts (cliente), queryKeys.ts, format.ts, useNow.ts, sound.ts, wakeLock.ts
  types/                database.ts (generado con `supabase gen types`), domain.ts (tipos de UI)
  services/             menu.ts, orders.ts, alerts.ts, tables.ts, staff.ts, admin.ts — funciones puras sobre supabase
  hooks/                useMenu, useSessionState, useStaffOrders, useAlerts, useAuth, useRealtime…
  features/
    client/             (los componentes actuales de client/ + ItemOptionsSheet, MyOrders, SessionBill)
    waiter/             (actuales + TablesGrid, ReadyToDeliver, filtro por asignación)
    kitchen/            (actuales + opciones en ticket, fullscreen, sonido)
    admin/              MenuAdmin, ItemForm, OptionGroupsEditor, TablesAdmin, SectorsAdmin, StaffAdmin, Settings, QrSheet
    auth/               Login, Register
    demo/               DemoBar (el ViewSwitcher actual)
  components/ui/        Button, Sheet, ConfirmDialog, Toast, EmptyState, Skeleton, Badge, QtyControl
docs/                   deploy.md, alta-restaurante.md, manual-mozo-cocina.md
.github/workflows/ci.yml
```

---

## Fases de implementación

Cada fase deja la app funcionando y se cierra con un commit. Orden pensado para no tocar los mismos archivos dos veces.

### Fase 0 — Base técnica (TS, rutas, tooling)
Objetivo: mismo comportamiento de hoy, sobre cimientos vendibles.
1. TypeScript: `tsconfig.json` (strict), renombrar `.jsx/.js → .tsx/.ts`, tipar `RestaurantContext` y datos mock. Script `typecheck`.
2. `react-router`: estructura `src/app/` con las rutas de arriba; la vista actual queda bajo `/demo/*`. `AppShell` + `ErrorBoundary`.
3. Extraer UI reutilizable a `components/ui/` (`Sheet` con `useFocusTrap` y cierre por Escape/backdrop, `ConfirmDialog` reemplaza `window.confirm`, `QtyControl` sale de `CartDrawer`).
4. `formatPrice(cents, currency)` y precios mock a centavos.
5. Vitest + Testing Library: tests de `format.ts`, del reducer del carrito y un render smoke por vista.
6. Separar hooks de providers (`hooks/useRestaurant.ts`) para eliminar el warning de fast-refresh.

### Fase 1 — Supabase: esquema, RLS, RPC, seed
1. `supabase init`, `supabase start` (Docker local) y primera migración con el esquema completo de arriba (incluye variantes y sesiones aunque la UI llegue después).
2. Funciones helper (`current_restaurant_id()`, `current_staff_role()`) y políticas RLS por tabla.
3. RPCs `place_order`, `create_alert`, `get_table_by_token`, `get_session_state`, `join_restaurant`, `create_restaurant`, `reset_demo`.
4. `seed.sql` con el tenant `demo` (migra el contenido de `data/menu.js` y `data/seed.js`, incluyendo un plato con variantes para probar).
5. `supabase gen types typescript` → `src/types/database.ts` (script `npm run db:types`).
6. Verificar RLS con SQL manual (`set role anon` / `set request.jwt.claims`).

### Fase 2 — Cliente conectado
1. `lib/supabase.ts`, `providers.tsx` con `QueryClientProvider`.
2. `services/menu.ts` + `useMenu(slug)`: categorías, platos, opciones; agotados se muestran deshabilitados.
3. Ruta `/r/:slug/m/:tableToken`: `get_table_by_token` → header con marca del restaurante (nombre, logo, color vía CSS variable `--color-brand-500`).
4. Carrito local (reducer actual, tipado). "Confirmar" llama a `place_order`; guarda `session_id` en `localStorage` por `tableToken`.
5. Pantalla **Mis pedidos**: `useSessionState` con polling; tracker de estado por pedido; tab **La cuenta** con total acumulado. Al cerrarse la sesión: pantalla "Gracias por tu visita" y limpieza local.
6. Llamar mozo / pedir cuenta → `create_alert`; botón deshabilitado mientras haya una alerta sin resolver ("Ya avisamos al mozo").
7. Skeletons de carga, `ErrorBoundary`, banner offline. Eliminar `data/menu.js`, `data/seed.js` y la persistencia `localStorage` del store global (la demo pasa a usar Supabase).

### Fase 3 — Auth, roles, mozo y cocina en tiempo real
1. `useAuth` (sesión Supabase), `/login`, `/registro` con código de invitación, guard por rol en layouts.
2. `useRealtime(restaurantId)`: un canal, invalida queries por tabla.
3. **Mozo**: alertas y pedidos `pending` (como hoy) + lista **Listos para entregar** (`ready` → `delivered`) + **Mesas** (grid por sector con estado de sesión, total abierto, "Cerrar mesa"). Filtro por asignación (`waiter_assignments`: sectores ∪ mesas; sin asignación = ve todo) con toggle "Ver todas".
4. **Cocina**: tickets `kitchen` → botón "Listo" (`ready`). Muestra opciones elegidas debajo de cada plato.
5. `OrderEditModal` guarda vía `services/orders.ts` (update de `order_items` + `total` recalculado en un RPC `update_order_items` para no confiar en el cliente).
6. Tenant demo: `/demo/mozo` y `/demo/cocina` funcionan sin login (RLS `is_demo`); `DemoBar` con botón "Reiniciar demo" → `reset_demo()`.

### Fase 4 — Variantes y extras
1. `ItemOptionsSheet`: al tocar un plato con `option_groups`, hoja con grupos single (radio) / multiple (checkbox), validación de `required/min/max`, precio en vivo, cantidad y notas.
2. Línea de carrito identificada por `itemId + hash(opciones)`; `place_order` ya valida y cotiza opciones del lado servidor.
3. Render de opciones en `OrderCard`, `KitchenTicket`, `MyOrders`.

### Fase 5 — Panel admin (simple)
1. `/admin` con navegación lateral: **Menú**, **Mesas y sectores**, **Personal**, **Configuración**.
2. **Menú**: lista por categoría con **precio editable inline** y switches **Visible** / **Agotado hoy** (`sold_out_until = current_date`). Formulario de plato (nombre, descripción, categoría, imagen: URL o subida a Storage bucket `menu-images`, tags) + editor de grupos de opciones. CRUD de categorías con orden.
3. **Mesas y sectores**: crear sectores; crear mesas (número, etiqueta, sector); botón **Descargar QR** (PNG por mesa con `qrcode`) y **Hoja de QRs** (todas las mesas, para imprimir).
4. **Personal**: lista de staff con rol y activo/inactivo; generar invitación (email + rol → código); para cada mozo, asignar sectores y/o mesas (checkboxes).
5. **Configuración**: nombre, tagline, logo, color principal, moneda, código de invitación general.
6. Alta SaaS: `/registro` sin código ofrece "Crear mi restaurante" → `create_restaurant`.

### Fase 6 — Pulido de producto y entrega
1. Sonido + vibración en mozo/cocina al llegar alerta/comanda (`lib/sound.ts`, desbloqueo con el primer toque).
2. Cocina: botón pantalla completa + Wake Lock. PWA: `manifest.webmanifest`, íconos, `theme-color`.
3. Landing en `/` con "Probar demo" (cliente `/demo/m/<token>`, mozo, cocina) y contacto.
4. CI (`.github/workflows/ci.yml`): lint, typecheck, test, build. Deploy en **Vercel** (SPA rewrite, env vars) y proyecto Supabase productivo con `supabase db push`; `pg_cron` para `reset_demo()`.
5. `docs/`: `deploy.md`, `alta-restaurante.md` (checklist para onboardear un cliente en 30 min), `manual-mozo-cocina.md`.
6. Actualizar `CLAUDE.md` y `README.md` con la arquitectura final.

---

## Verificación

- **Por fase:** `npm run lint && npm run typecheck && npm test && npm run build` en verde.
- **Fase 1:** `supabase db reset` aplica migraciones + seed sin error. Consultas manuales: como `anon`, `select * from orders` devuelve 0 filas; `place_order` con precio manipulado en el payload devuelve el precio de la DB; `place_order` sobre plato agotado falla.
- **Fase 2–3 (flujo real multi-dispositivo):** abrir en el Browser pane dos pestañas: `/demo/m/<token>` (cliente) y `/demo/mozo`; tercera `/demo/cocina`. Pedido desde el cliente → aparece en mozo **sin recargar**; mozo envía a cocina → aparece en cocina; cocina marca Listo → el cliente ve "Listo" en ≤ 8 s; mozo marca Entregado y cierra mesa → cliente ve "Gracias por tu visita". Repetir con un mozo asignado a un sector para confirmar el filtrado.
- **Fase 4:** pedir una pizza "Grande + extra queso" y verificar que el total del cliente, el de `orders.total` y el ticket de cocina coinciden.
- **Fase 5:** cambiar un precio y marcar "Agotado hoy" desde `/admin` → el cliente lo ve al instante; descargar QR y escanearlo con un celular real contra la URL de Vercel.
- **Fase 6:** instalar como PWA en una tablet, dejar la cocina abierta 10 min sin que se apague; probar el sonido con la pantalla bloqueada.
- **Antes de vender:** recorrer `docs/alta-restaurante.md` de punta a punta creando un restaurante nuevo desde cero en producción.

## Fuera de alcance (post-MVP, dejar anotado en CLAUDE.md)

Pagos online (Mercado Pago), impresión térmica, facturación de suscripciones (Stripe/MP), múltiples restaurantes por usuario, reportes/analytics de ventas, i18n más allá de es-AR, app nativa.
