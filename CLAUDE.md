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
Estado actual: **Fase 0 completada** (base técnica). La demo sigue funcionando con store local; el backend llega en Fases 1–2.

## 2. Stack

- **React 19** + **Vite 8** + **TypeScript** (strict, `verbatimModuleSyntax`, alias `@/` → `src/`)
- **Tailwind CSS 4** vía `@tailwindcss/vite` (tokens en `src/index.css` con `@theme`; no hay `tailwind.config.js`)
- **react-router 7** (`createBrowserRouter`, rutas en `src/app/router.tsx`)
- **lucide-react** para iconos
- **@supabase/supabase-js** instalado; **todavía no se usa en `src/`** (Fase 1–2)
- Tests: **Vitest** + Testing Library + jsdom (`src/test/setup.ts`)
- Lint: `oxlint` (no ESLint). Node 24 / npm 11.

### Comandos

```bash
npm run dev         # http://localhost:5173
npm run typecheck   # tsc -b
npm test            # vitest run
npm run lint        # oxlint
npm run build       # tsc -b && vite build (falla si hay errores de tipos)
```

Antes de cerrar cualquier cambio: `lint`, `typecheck`, `test` y `build` en verde.
Hay `.claude/launch.json` (config `menu-web`) para levantar el dev server desde el Browser pane.

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
/                 landing (features/landing) con acceso a la demo
/demo             → redirige a /demo/cliente
/demo/cliente     vista cliente (store local)
/demo/mozo        panel del mozo
/demo/cocina      pantalla de cocina
*                 404 (app/RouteError)
(Fase 2+)         /r/:slug/m/:tableToken · /login · /registro · /mozo · /cocina · /admin
```

Las vistas se cargan con `React.lazy` (un chunk por rol). `RootLayout` provee `ToastProvider` + `Suspense`; `DemoLayout` provee `RestaurantProvider` + `DemoBar`.

## 4. Estructura

```
src/
├── main.tsx                     # RouterProvider
├── index.css                    # @import tailwindcss, @theme (brand-*), animaciones, .no-scrollbar
├── app/
│   ├── router.tsx               # `routes` (para tests con createMemoryRouter) y `router`
│   ├── RootLayout.tsx           # ToastProvider + Suspense + lazy imports de las vistas
│   ├── RouteError.tsx           # 404 / error de render
│   └── router.test.tsx          # smoke de rutas + flujo cliente→mozo
├── types/domain.ts              # MenuItem, CartItem, Order, Alert, OrderStatus, ToastTone…
├── data/                        # mock de la demo (se elimina en Fase 2)
│   ├── menu.ts                  # RESTAURANT {name, tagline, currency}, CATEGORIES, MENU_ITEMS
│   └── seed.ts                  # SEED_ORDERS, SEED_ALERTS
├── lib/
│   ├── format.ts                # formatPrice(cents, currency, locale), timeAgo, minutesSince, sumLines, countUnits, plural
│   ├── uid.ts                   # ids locales de la demo
│   └── useNow.ts                # reloj reactivo
├── store/                       # estado de la DEMO (localStorage `don-remolo-demo-v2`)
│   ├── restaurantReducer.ts     # reducer puro + initialState + tipos de acción (testeado)
│   ├── restaurant-context.ts    # contexto + tipos de acciones/derivados
│   └── RestaurantProvider.tsx   # persistencia, acciones, derivados
├── hooks/
│   ├── useRestaurant.ts         # acceso al store (lanza si falta el Provider)
│   ├── useToast.ts              # toast.show(message, tone)
│   └── useFocusTrap.ts          # trap de foco para diálogos
├── components/ui/               # primitivos sin dependencia del store
│   ├── Modal.tsx                # <Modal> (portal, overlay, Escape, scroll-lock, focus trap) y <Sheet> (hoja inferior con header/body/footer)
│   ├── ConfirmDialog.tsx        # reemplazo de window.confirm
│   ├── Button.tsx               # variantes primary/secondary/success/danger/dangerSolid/ghost/dark, tamaños sm/md/lg
│   ├── QtyControl.tsx, EmptyState.tsx, PageSpinner.tsx
│   ├── ToastProvider.tsx + toast-context.ts
└── features/
    ├── client/    ClientView, ClientHeader, MenuFilters, MenuItemCard, CartDrawer
    ├── waiter/    WaiterView, AlertsPanel, OrderCard, OrderEditModal
    ├── kitchen/   KitchenView, KitchenTicket, urgency.ts
    ├── demo/      DemoLayout, DemoBar (NavLinks + badges + reset)
    └── landing/   LandingPage
```

## 5. Modelo de estado (demo)

`RestaurantState = { table, cart, orders, alerts }` en `useReducer`, persistido en `localStorage`
bajo `don-remolo-demo-v2`. **Subir la versión de la clave** si cambia la forma del estado.
Los toasts NO viven en el store: los componentes llaman `useToast().show()` después de la acción.

- **Importes en centavos** (`price: 650000` = $6.500). Mostrar siempre con `formatPrice(cents, RESTAURANT.currency)`.
- Ciclo de un pedido: `pending` → `kitchen` (`sentToKitchenAt`) → `done` (`doneAt`). En Fase 1 pasa a `pending → kitchen → ready → delivered | cancelled`.
- El precio se **copia** a la línea al agregar (snapshot). `ALERT_ADD` deduplica por `(table, type)`.
- El mozo edita sobre copia local en `OrderEditModal`; persiste sólo al Guardar / Enviar.
- Derivados: `cartTotal`, `cartCount`, `pendingOrders`, `kitchenOrders` (orden por `sentToKitchenAt`), `doneOrders`.
- Acciones: `setTable, addToCart, setCartQty, setCartNotes, clearCart, submitOrder, updateOrderItems, sendToKitchen, markOrderDone, deleteOrder, addAlert, resolveAlert, resetDemo`.

## 6. Convenciones

- **Idioma:** UI, comentarios, commits y docs en **español** (voseo en UI: "Agregá", "Probá").
- **TypeScript estricto**: sin `any`; tipos de dominio en `types/domain.ts`; `import type` para tipos.
- **Un archivo = componentes o helpers, no ambos** (regla fast-refresh de oxlint). Hooks en `hooks/`, contextos en `*-context.ts`, helpers puros en `.ts`.
- **Mobile-first.** Todo debe funcionar a 360px. Botones con `whitespace-nowrap`; footers con `flex-wrap`.
- **Sin librerías de UI.** Diálogos siempre sobre `Modal`/`Sheet` (accesibilidad resuelta ahí). Confirmaciones con `ConfirmDialog`, nunca `window.confirm`.
- **Botones:** usar `<Button>` salvo controles muy específicos (chips, barra flotante, tabs). Nunca sobreescribir el color de una variante con `className`: crear variante.
- **Colores:** `brand-*` (naranja) para marca. Semánticos: emerald = OK/enviar, amber = pendiente, red = urgente/alerta, sky = cuenta/en cocina, yellow = notas de cocina.
- **z-index:** barra demo 40, filtros sticky 30, botón carrito 40, modales 50 (portal a `body`), toast 60.
- **Tiempo:** nunca `Date.now()` en render; `useNow(intervalo)` y pasar `now` por props.
- **Accesibilidad mínima:** `aria-label` en botones de ícono, `aria-hidden` en íconos decorativos, `role="dialog"` + `aria-modal` + `aria-labelledby` en diálogos, `role="status"` para toasts.
- **Tests:** utilidades y reducers con tests unitarios; vistas con smoke vía `createMemoryRouter(routes)`. Ejecutar `npm test` antes de commitear.

## 7. Roadmap (ver `docs/plan-producto.md`)

- [x] **Fase 0** — TS, react-router, `components/ui`, precios en centavos, Vitest, hooks separados
- [ ] **Fase 1** — Supabase: esquema, RLS, RPCs, seed del tenant demo, tipos generados
- [ ] **Fase 2** — Cliente conectado: `/r/:slug/m/:token`, menú desde DB, `place_order`, Mis pedidos / La cuenta
- [ ] **Fase 3** — Auth + roles, mozo y cocina en tiempo real, sectores y asignación de mozos, demo pública
- [ ] **Fase 4** — Variantes y extras
- [ ] **Fase 5** — Panel admin simple (precios, agotado hoy, mesas/QR, personal, configuración)
- [ ] **Fase 6** — Sonido, PWA/wake lock, landing, CI, deploy Vercel, docs de operación

Fuera de alcance del MVP: pagos online, impresión térmica, facturación de suscripciones, reportes, app nativa.
