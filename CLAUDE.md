# CLAUDE.md — Contexto del proyecto "Menú Digital" (SaaS para restaurantes)

> **Regla para Claude:** leer este archivo completo antes de cualquier cambio y
> mantenerlo actualizado cuando cambie la arquitectura, el modelo de datos, las
> convenciones o el roadmap. Si algo de aquí contradice el código, el código manda
> y este archivo debe corregirse. El plan completo de producto está en
> [`docs/plan-producto.md`](docs/plan-producto.md); avanzar fase por fase y marcar el avance en §7.

## 1. Qué es

Menú digital interactivo para restaurantes (QR en mesa). Una sola SPA con tres roles:

| Vista | Para quién | Qué hace |
|---|---|---|
| **Cliente** | comensal en la mesa (móvil) | ve el menú, filtra/busca, arma carrito con notas por plato, confirma pedido, llama al mozo, pide la cuenta |
| **Mozo** | personal de salón | ve alertas (llamado / cuenta) y las resuelve; revisa comandas entrantes, edita cantidades/notas, las envía a cocina |
| **Cocina (KDS)** | cocineros | tarjetas de comandas aprobadas con tiempo transcurrido, color por urgencia y notas resaltadas; marca como listo |

Modelo de negocio decidido: **SaaS multi-restaurante** (una app, una base Supabase, cada restaurante con su `slug`).
Estado actual: **Fases 0–3 completadas**. Backend en Supabase (dev) y frontend conectado: comensal, mozo y cocina
operan sobre datos reales; el tenant demo funciona sin login; el personal real inicia sesión y opera su propio
restaurante con roles y mesas asignadas. Falta admin (Fase 5) y entrega (Fase 6).

## 2. Stack

- **React 19** + **Vite 8** + **TypeScript** (strict, `verbatimModuleSyntax`, alias `@/` → `src/`)
- **Tailwind CSS 4** vía `@tailwindcss/vite` (tokens en `src/index.css` con `@theme`; no hay `tailwind.config.js`)
- **react-router 7** (`createBrowserRouter`, rutas en `src/app/router.tsx`)
- **lucide-react** para iconos
- **Supabase** (Postgres + Auth + Realtime) con `@supabase/supabase-js`; la CLI (`supabase`, devDependency) está
  **vinculada al proyecto de desarrollo** `oopowxlxpwsjpmpyuckm`. No hay Docker en esta máquina: se trabaja
  directo contra ese proyecto (es de desarrollo, no productivo).
- Tests: **Vitest** + Testing Library + jsdom (`src/test/setup.ts`)
- Lint: `oxlint` (no ESLint). Node 24 / npm 11.

### Comandos

```bash
npm run dev         # http://localhost:5173
npm run typecheck   # tsc -b
npm test            # vitest run
npm run lint        # oxlint
npm run build       # tsc -b && vite build (falla si hay errores de tipos)

npm run db:push         # supabase db push --linked --include-seed  (migraciones + supabase/seed.sql)
npm run db:types        # regenera src/types/database.ts desde el proyecto (correr tras cada migración)
npm run db:verify       # node scripts/verify-rls.mjs — 21 checks de RLS/RPC con la anon key
npm run db:verify:staff # node scripts/verify-staff-ops.mjs — 7 checks de close_table_session y aislamiento por tenant
```

Antes de cerrar cualquier cambio: `lint`, `typecheck`, `test` y `build` en verde; si tocaste SQL, además `db:push`, `db:types` y ambos `db:verify*`.

> **Trampa de lógica de tres valores en SQL** (real, mordió en la Fase 3): una función `boolean` que termina en
> `a = b or c in (...)` puede devolver `NULL` en vez de `false` cuando `a = b` compara contra un `NULL` (p. ej.
> `current_restaurant_id()` sin sesión). En una política RLS `using (...)` eso es inofensivo (Postgres trata NULL
> como "no pasa"), pero en `if not mi_funcion(...) then raise ...` es un bug de seguridad: `not NULL` es NULL, y
> un `IF` con NULL no dispara. Siempre envolver funciones de autorización en `coalesce(..., false)`
> (`can_operate`/`can_manage` en `20260917000700_fix_can_operate_null.sql`). Se detectó con `db:verify:staff`
> contra un tenant privado real, no por inspección de código — correr los scripts de verificación, no alcanza con leer el SQL.
Hay `.claude/launch.json` (config `menu-web`) para levantar el dev server desde el Browser pane.

> Nunca editar archivos con `String.prototype.replace` en scripts Node cuando el texto de reemplazo contiene `$`
> (`$'`, `$&`… son patrones especiales): corrompió un regex SQL en la Fase 1. Usar el tool Edit o `split/join`.

> Nota Windows: editar archivos con `sed -i` no dispara el watcher de Vite (reemplaza por rename). Si el dev server sirve código viejo, tocar el archivo o reiniciar `npm run dev`.

### Variables de entorno

`.env.local` (ignorado por git, patrón `*.local`):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Nunca commitear valores. Nunca poner secretos en código.

## 3. Rutas

```
/                          landing (features/landing) con acceso a la demo
/r/:slug/m/:tableToken     COMENSAL: resuelve la mesa por token (get_table_by_token), valida el slug, monta ClientView
/demo                      → redirige a /demo/m/demo-mesa-04
/demo/m/:tableToken        comensal sobre el tenant demo (con DemoBar)
/demo/mozo · /demo/cocina  mozo y cocina del tenant demo SIN login (RLS is_demo)
/login                     email + contraseña (Supabase Auth)
/registro                  "Tengo un código" (join_restaurant) o "Crear mi restaurante" (create_restaurant)
/mozo                      STAFF real: StaffLayout(allowedRoles=['waiter']) → WaiterView
/cocina                    STAFF real: StaffLayout(allowedRoles=['kitchen']) → KitchenView
*                          404 (app/RouteError)
(Fase 5+)                  /admin
```

Las vistas se cargan con `React.lazy` (un chunk por rol). `RootLayout` provee `QueryClientProvider` + `AuthProvider` + `ToastProvider` + `Suspense` + `OfflineBanner`.
`DemoLayout` carga el restaurante `demo` por slug (sin auth), lo publica en `RestaurantScopeContext` con `staffId: null, role: null`, suscribe realtime y renderiza `DemoBar`.
`StaffLayout` exige sesión real (si no, `<Navigate to="/login" state={{from}}>`), resuelve `staff` del usuario (`useMyStaff`), valida rol (owner/admin siempre pasan; si no, `allowedRoles`) y publica el scope con `staffId`/`role` reales; renderiza `StaffTopBar` (nombre, rol, cerrar sesión, y para owner/admin un switch Mozo↔Cocina) en vez de `DemoBar`.
`WaiterView`/`KitchenView` son agnósticos de demo-vs-real: sólo leen `useRestaurantScope()`, nunca `useAuth()` directo. `--topbar-h` sólo lo usa `ClientView` (comensal bajo `DemoBar`); las vistas de staff no lo necesitan.

## 4. Estructura

```
src/
├── main.tsx                     # RouterProvider
├── index.css                    # @import tailwindcss, @theme (brand-*), animaciones, .no-scrollbar
├── app/
│   ├── router.tsx               # `routes` (para tests con createMemoryRouter) y `router`
│   ├── RootLayout.tsx           # providers + Suspense + lazy imports de las vistas
│   ├── queryClient.ts           # createAppQueryClient (staleTime 10 s, retry 1)
│   ├── RouteError.tsx           # 404 / error de render
│   └── router.test.tsx          # rutas + flujo comensal (variantes → pedido → Mis pedidos) + mozo + cocina, con services mockeados
├── types/
│   ├── database.ts              # GENERADO por `npm run db:types` — no editar a mano
│   └── domain.ts                # tipos de UI (camelCase): Restaurant, TableContext, Menu/MenuItem/OptionGroup, CartLine, SessionState, StaffOrder, StaffAlert…
├── lib/
│   ├── supabase.ts              # cliente único (anon key); lanza si faltan las env vars
│   ├── queryKeys.ts             # qk.*: todo lo del staff cuelga de ['staff', restaurantId]
│   ├── errors.ts                # toAppError: códigos de las RPCs → mensajes en español
│   ├── format.ts                # formatPrice(cents, currency, locale), timeAgo, minutesSince, sumLines, countUnits, plural
│   ├── uid.ts, useNow.ts
├── services/                    # funciones puras sobre supabase-js; mapean filas → dominio. SE MOCKEAN en tests.
│   ├── restaurants.ts           # fetchRestaurantBySlug, toRestaurant
│   ├── tables.ts                # fetchTableByToken (RPC) · fetchTablesOverview, closeTableSession (RPC, staff)
│   ├── menu.ts                  # fetchMenu (categorías + platos con option_groups/options embebidos; soldOut calculado)
│   ├── orders.ts                # placeOrder, fetchSessionState (RPCs) · fetchActiveOrders, updateOrderStatus, updateOrderItems (staff)
│   ├── alerts.ts                # createAlert (RPC) · fetchOpenAlerts, resolveAlert
│   ├── staff.ts                 # fetchMyStaff(userId) (+ restaurante embebido), fetchMyAssignments(staffId)
│   ├── auth.ts                  # getSession, onAuthStateChange, signIn/signUp/signOut, resendSignupEmail, joinRestaurant, createRestaurant (RPCs)
│   ├── realtime.ts              # subscribeToRestaurant(rid, onChange) — postgres_changes filtrados por restaurant_id
│   └── demo.ts                  # DEMO_SLUG, DEMO_TABLE_TOKEN, DEMO_CLIENT_PATH, resetDemo
├── hooks/
│   ├── useQueries.ts            # useRestaurantBySlug, useTableByToken, useMenu, useSessionState (polling 8 s), useActiveOrders, useOpenAlerts, useTablesOverview, useMyAssignments, useMyStaff, useRealtimeInvalidation
│   ├── useStaffMutations.ts     # setStatus / editItems / resolve / closeSession con invalidación de ['staff', rid] y toast de error
│   ├── useAuth.ts               # consume AuthContext (session, userId, loading, signOut)
│   ├── useToast.ts, useFocusTrap.ts
├── components/ui/               # primitivos sin dependencia de datos
│   ├── Modal.tsx (Modal + Sheet), ConfirmDialog.tsx, Button.tsx, QtyControl.tsx, EmptyState.tsx, PageSpinner.tsx
│   ├── Skeleton.tsx (MenuSkeleton, CardsSkeleton), ErrorState.tsx, OfflineBanner.tsx, ToastProvider.tsx + toast-context.ts
└── features/
    ├── client/
    │   ├── ClientLayout.tsx     # ruta: resuelve token → skeleton / error / "Mesa no encontrada" / ClientProvider + tema de marca (brandStyle.ts)
    │   ├── ClientProvider.tsx   # sesión efectiva (mesa abierta en servidor ?? última local) + carrito, persistidos por token
    │   ├── client-context.ts, useClient.ts, cartReducer.ts (puro, testeado), optionRules.ts (puro, testeado)
    │   ├── ClientView.tsx       # tabs Menú / Mis pedidos, filtros, carrito flotante, alertas, ThanksScreen si la sesión se cerró
    │   ├── ClientHeader, MenuFilters, MenuItemCard, ItemOptionsSheet, CartDrawer, MyOrders, OrderStatusSteps, ThanksScreen
    ├── auth/
    │   ├── auth-context.ts, AuthProvider.tsx  # sesión de Supabase Auth, global (RootLayout)
    │   ├── LoginPage.tsx, RegisterPage.tsx, ConfirmEmailNotice.tsx
    │   └── pendingSetup.ts      # guarda en localStorage qué hacer (canjear código / crear restaurante) para completarlo cuando vuelve del link de confirmación de email
    ├── staff/
    │   ├── restaurant-scope-context.ts, useRestaurantScope  # { restaurant, staffId, role } — null/null en la demo
    │   ├── StaffLayout.tsx, StaffTopBar.tsx, roleHome.ts     # guard real de /mozo y /cocina
    ├── waiter/    WaiterView (tabs Pedidos/Mesas; alertas · entrantes · listos para entregar · en cocina), AlertsPanel, OrderCard,
    │              OrderEditModal, TablesOverview (grilla de mesas + "Cerrar mesa"), assignmentFilter.ts (puro, testeado)
    ├── kitchen/   KitchenView, KitchenTicket, urgency.ts
    ├── demo/      DemoLayout, DemoBar (NavLinks + badges + reset_demo)
    └── landing/   LandingPage
```

## 5. Modelo de datos en el frontend

**Estado de servidor = React Query** (`hooks/useQueries.ts`), nunca en contextos propios. Claves en `lib/queryKeys.ts`.
- Staff: `useActiveOrders` / `useOpenAlerts` con `refetchInterval` 15 s de respaldo; `useRealtimeInvalidation(rid)` invalida `['staff', rid]` (y `['menu', rid]` para `menu_items`) al llegar un evento.
- Comensal: `useSessionState(sessionId)` hace polling cada 8 s (también con la pestaña oculta) y se detiene cuando la sesión no existe o está cerrada. Anónimo no usa realtime (RLS).
- Mutaciones con `useMutation`; el éxito invalida las claves afectadas; el error va a un toast con `toAppError`.

**Estado local del comensal** (`ClientProvider`): `sessionId = table.session?.id ?? localSessionId` y `cart` (reducer puro), persistidos en `localStorage` bajo `menu:session:<token>` y `menu:cart:<token>`.
- `CartLine.key = itemId|opcionesOrdenadas`: misma variante se fusiona; `unitPrice` es sólo para mostrar (el servidor recalcula en `place_order`).
- Platos con `optionGroups` abren `ItemOptionsSheet` (reglas en `optionRules.ts`: required/min/max/single, preselección del primer single obligatorio); sin opciones se agregan directo.
- Sesión cerrada (`status = 'closed'`): `ThanksScreen`; "Ver el menú de nuevo" refetchea la mesa y limpia sesión + carrito. Cierres de hace > 2 h se limpian solos.
- Botones "Llamar al Mozo" / "Pedir la Cuenta" se deshabilitan mientras haya una alerta abierta de ese tipo (`create_alert` es idempotente igual).

**Importes en centavos** siempre; mostrar con `formatPrice(cents, restaurant.currency)`. Ciclo de pedido: `pending → kitchen → ready → delivered | cancelled`
(mozo: A cocina / Entregado / Cancelar; cocina: Listo). Los timestamps los sella la base.

## 5b. Base de datos (Supabase) — `supabase/migrations/`

Migraciones aplicadas (orden): `000100_schema` → `000200_functions` → `000300_policies` → `000400_demo_seed_fn` → `000500_demo_data_and_cron` → `000600_close_session` → `000700_fix_can_operate_null`.
`supabase/seed.sql` sólo crea el tenant privado **"Bar de Prueba"** (`bar-prueba`, tokens `prueba-mesa-01/02`) para tests de aislamiento; no va a producción.

**Tablas** (todas con `restaurant_id` y RLS): `restaurants`, `sectors`, `tables` (token del QR), `staff` (id = auth.users.id, rol owner/admin/waiter/kitchen),
`staff_invites` (código canjeable, single-use), `waiter_assignments` (sector **o** mesa), `categories`, `menu_items` (`price` centavos, `is_available`, `sold_out_until`),
`option_groups` (single/multiple, required, min/max), `options` (`price_delta`), `table_sessions` (una abierta por mesa: open → bill_requested → closed),
`orders` (pending → kitchen → ready → delivered | cancelled; `total` lo mantiene un trigger), `order_items` (snapshots de nombre/precio, `selected_options` jsonb, `line_total` generado), `alerts` (una abierta por mesa y tipo).

**RPCs** (`security definer`, el cliente anónimo sólo escribe a través de ellas):
- `get_table_by_token(p_token)` → restaurante + mesa + sesión abierta (o `null`).
- `place_order(p_token, p_items)` con `p_items = [{menu_item_id, qty, notes, option_ids[]}]` → `{order_id, session_id, total}`. **Recalcula precios y valida variantes en servidor**; errores: `EMPTY_ORDER`, `TABLE_NOT_FOUND`, `ITEM_NOT_FOUND`, `ITEM_UNAVAILABLE: <nombre>`, `OPTION_REQUIRED/MIN/MAX/SINGLE: <grupo>`, `OPTION_INVALID`, `INVALID_QTY`.
- `create_alert(p_token, p_type)` → `{alert_id, session_id, created}` (idempotente; `bill` pasa la sesión a `bill_requested`).
- `get_session_state(p_session_id)` → sesión, mesa, pedidos con ítems, alertas abiertas y total (el uuid de sesión es la capacidad del comensal).
- `join_restaurant(p_code, p_display_name?)`, `create_restaurant(p_name, p_slug)` (autenticado; errores `NOT_AUTHENTICATED`, `ALREADY_STAFF`, `INVITE_INVALID`, `INVITE_EMAIL_MISMATCH`, `SLUG_INVALID`, `SLUG_TAKEN`).
- `close_table_session(p_session_id)` (Fase 3, staff): cierra la mesa, resuelve sus alertas abiertas. Idempotente si ya estaba cerrada. Errores: `SESSION_NOT_FOUND`, `NOT_AUTHORIZED`, `SESSION_HAS_ACTIVE_ORDERS`.
- `reset_demo()` (público) recrea el tenant demo; `seed_demo()` es interna. pg_cron intenta correr `reset_demo()` cada hora (`reset-demo`); confirmar en el dashboard → Integrations → Cron.

**RLS**: helpers `current_restaurant_id()`, `current_staff_role()`, `is_manager()` (security definer) y `can_operate(rid)` / `can_manage(rid)`, ambas envueltas en `coalesce(..., false)` —
**nunca les quites el coalesce**: sin él devuelven `NULL` para anon en un tenant no-demo (`p_restaurant_id = NULL` de `current_restaurant_id()`), que una política RLS trata como "no pasa" pero que un `if not can_operate(...) then raise` de PL/pgSQL **no dispara** (bug real, ver nota de la Fase 3 más arriba).
Menú y restaurantes: lectura pública. Mesas/sesiones/pedidos/ítems/alertas: sólo `can_operate`. Configuración (menú, mesas, sectores, staff, invitaciones): `can_manage`.
**Tenant demo** (`is_demo = true`, id `00000000-0000-4000-8000-000000000001`, slug `demo`, tokens `demo-mesa-01..12`): `can_operate`/`can_manage` son verdaderas para cualquiera, sin login.
Realtime publica `orders, order_items, alerts, table_sessions, menu_items` (respeta las políticas de select).

**Convenciones SQL**: ids deterministas del demo con `demo_uuid(bloque, n)`; funciones con `set search_path = public`; funciones internas con `revoke execute ... from public, anon, authenticated`;
nueva migración = nuevo archivo `YYYYMMDDHHmmss_nombre.sql` (nunca editar una ya aplicada), luego `db:push` + `db:types` + `db:verify` + `db:verify:staff`.
Cualquier función de autorización nueva (booleana, usada en `if not ... then raise`) va envuelta en `coalesce(..., false)` — no asumir que un `boolean` de SQL nunca es `NULL`.

## 5c. Auth y roles (Fase 3)

**Sesión**: `AuthProvider` (en `RootLayout`, envuelve toda la app) llama `getSession()` + se suscribe con `onAuthStateChange`; expone `{session, userId, loading, signOut}` vía `useAuth()`. Nunca leer `supabase.auth` directo desde un componente — todo pasa por `services/auth.ts`.

**Alta** (`RegisterPage`, dos modos): "Tengo un código" → `joinRestaurant(code, displayName)`; "Crear mi restaurante" → `createRestaurant(name, slug)` (slug autogenerado con `lib/slugify.ts`, editable). Antes de `signUpWithPassword` se guarda la acción en `localStorage` (`features/auth/pendingSetup.ts`) porque **el proyecto exige confirmar el email** (comprobado en vivo: `signUp` no devuelve sesión hasta confirmar) — si `signUp` sí trae sesión inmediata, se consume la acción ahí mismo; si no, se muestra `ConfirmEmailNotice` y, cuando el usuario vuelve del link (`emailRedirectTo: origin + '/registro'`, `detectSessionInUrl: true`), el `useEffect` de `RegisterPage` detecta la sesión nueva y termina el alta sola. Un `useRef` (`consumingRef`) evita que la acción se ejecute dos veces si el submit y el efecto llegan a solaparse.

**Guard** (`StaffLayout`, parametrizado con `allowedRoles`): sin sesión → `/login` (con `state.from`); sin fila `staff` → mensaje + link a `/registro`; `staff.is_active = false` → mensaje de cuenta desactivada; rol fuera de `allowedRoles` (owner/admin siempre entran) → mensaje + link a `roleHome(role)`. Sólo entonces publica `RestaurantScopeContext` y monta la vista — **la misma `WaiterView`/`KitchenView` que usa la demo**, sin ninguna rama de código demo-vs-real dentro de esas vistas.

**Asignación de mozos** (`waiter_assignments`, filtrado en el cliente): `useMyAssignments(staffId)` trae las filas del mozo logueado (`staffId` es `null` en la demo → hook desactivado → sin filtrar, comportamiento actual). `features/waiter/assignmentFilter.ts` (puro, testeado) filtra pedidos/alertas/mesas por sector ∪ mesa asignada; sin asignaciones = ve todo; toggle "Ver todas" en `WaiterView` la pasa por alto. **Todavía no hay UI para crear asignaciones** (eso es Fase 5 → Personal); por ahora se cargan a mano en la base.

**Mesas** (`TablesOverview`, pestaña del mozo): `fetchTablesOverview(restaurantId)` junta `tables` + `table_sessions` abiertas + suma de `orders.total` (no cancelados) por sesión, agrupadas por sector. "Cerrar mesa" llama `close_table_session`; se deshabilita preventivamente con `TableOverview.canClose` (mismo dato que ya trae `useActiveOrders`) y la RPC vuelve a validarlo server-side.

## 6. Convenciones

- **Idioma:** UI, comentarios, commits y docs en **español** (voseo en UI: "Agregá", "Probá").
- **TypeScript estricto**: sin `any`; tipos de dominio en `types/domain.ts`; `import type` para tipos.
- **Un archivo = componentes o helpers, no ambos** (regla fast-refresh de oxlint). Hooks en `hooks/`, contextos en `*-context.ts`, helpers puros en `.ts`.
- **Datos:** componentes → hooks (`useQueries`, `useStaffMutations`) → `services/` → supabase. Nunca llamar a `supabase` desde un componente. Los tests mockean `@/services/*` (fixtures en `src/test/fixtures.ts`).
- **Sin `setState` dentro de efectos** para sincronizar props (regla `react/set-state-in-effect`): derivar en render.
- **Mobile-first.** Todo debe funcionar a 360px. Botones con `whitespace-nowrap`; footers con `flex-wrap`.
- **Sin librerías de UI.** Diálogos siempre sobre `Modal`/`Sheet` (accesibilidad resuelta ahí). Confirmaciones con `ConfirmDialog`, nunca `window.confirm`.
- **Botones:** usar `<Button>` salvo controles muy específicos (chips, barra flotante, tabs). Nunca sobreescribir el color de una variante con `className`: crear variante.
- **Colores:** `brand-*` (naranja) para marca. Semánticos: emerald = OK/enviar, amber = pendiente, red = urgente/alerta, sky = cuenta/en cocina, yellow = notas de cocina.
- **z-index:** barra demo 40, filtros sticky 30, botón carrito 40, modales 50 (portal a `body`), toast 60.
- **Tiempo:** nunca `Date.now()` en render; `useNow(intervalo)` y pasar `now` por props.
- **Accesibilidad mínima:** `aria-label` en botones de ícono, `aria-hidden` en íconos decorativos, `role="dialog"` + `aria-modal` + `aria-labelledby` en diálogos, `role="status"` para toasts.
- **Tests:** utilidades y reducers con tests unitarios; vistas con smoke vía `createMemoryRouter(routes)`. Ejecutar `npm test` antes de commitear.
- **Auth:** nunca `supabase.auth.*` directo en un componente — pasa por `services/auth.ts` y `useAuth()`. Guards de ruta (`StaffLayout`) devuelven UI (`<Navigate>` o mensaje), nunca lanzan.
- **SQL de autorización:** toda función `boolean` para `if not fn(...) then raise` va con `coalesce(..., false)` (ver §5b) — verificarlo con `db:verify:staff`, no alcanza con leerlo.

## 7. Roadmap (ver `docs/plan-producto.md`)

- [x] **Fase 0** — TS, react-router, `components/ui`, precios en centavos, Vitest, hooks separados
- [x] **Fase 1** — Supabase: esquema, RLS, RPCs, seed del tenant demo, tipos generados, `db:verify` (21 checks)
- [x] **Fase 2** — Cliente conectado: `/r/:slug/m/:token`, menú desde DB, variantes (ItemOptionsSheet), `place_order`, Mis pedidos / La cuenta, mozo y cocina sobre Supabase con realtime
- [x] **Fase 3** — Auth (login/registro, confirmación de email), `StaffLayout` con guard por rol, `/mozo` y `/cocina` reales, filtro por asignación de mozo, pestaña Mesas + `close_table_session`, `db:verify:staff` (7 checks). **Pendiente de esta fase:** UI para generar invitaciones y asignar sectores/mesas (se hace en Fase 5 → Personal); verificación end-to-end del login real (bloqueada por confirmación de email — ver §5c y el mensaje de cierre de fase)
- [ ] **Fase 4** — (fusionada con la Fase 2/5) el editor de variantes en el admin queda en Fase 5
- [ ] **Fase 5** — Panel admin simple (precios, agotado hoy, mesas/QR, personal → invitaciones y asignación de mozos, configuración)
- [ ] **Fase 6** — Sonido, PWA/wake lock, landing, CI, deploy Vercel, docs de operación

Fuera de alcance del MVP: pagos online, impresión térmica, facturación de suscripciones, reportes, app nativa.
