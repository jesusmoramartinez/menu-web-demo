# 🍕 Menú Digital para Restaurantes (SaaS) — demo "Pizzería Don Remolo"

Menú digital con QR por mesa y comandas en tiempo real. Cuatro vistas en una sola app:
**Cliente** (menú + carrito + notas), **Mozo** (alertas + revisión de comandas + mesas), **Cocina** (KDS con
tiempos, urgencia y notas resaltadas) y **Administración** (menú y variantes, mesas/QR, personal e invitaciones,
configuración). El personal de un restaurante real inicia sesión (`/login`, `/registro`) y opera sólo su propio
restaurante; el tenant demo (`/demo/*`, incluido `/demo/admin`) sigue sin login.

Stack: **React 19 · Vite 8 · TypeScript · Tailwind CSS 4 · react-router 7 · TanStack Query · lucide-react · Vitest**.
Backend: **Supabase** (Postgres + RLS + RPCs + Realtime), migraciones en `supabase/migrations/`. Roadmap en [`docs/plan-producto.md`](docs/plan-producto.md).

## Correr el proyecto

```bash
npm install
npm run dev
```

Necesitás `.env.local` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` del proyecto Supabase (ver `CLAUDE.md`).
Abrí `http://localhost:5173`:

- `/` landing con acceso a la demo
- `/demo/m/demo-mesa-04` (comensal) · `/demo/mozo` · `/demo/cocina` · `/demo/admin` — el tenant demo funciona sin login y en tiempo real; abrilos en distintas pestañas o dispositivos
- `/r/<slug>/m/<token>` — URL que va en el QR de cada mesa de un restaurante real
- `/login` · `/registro` (código de invitación o crear un restaurante nuevo) · `/mozo` · `/cocina` · `/admin` — personal real, con guard por rol (`/admin` sólo dueño/administración)
- El botón ↻ de la barra reinicia la demo (también se reinicia sola cada hora)

> El proyecto Supabase de desarrollo exige confirmar el email al registrarse: después de `/registro` llega un
> correo con un link; hasta confirmarlo no hay sesión. Es el comportamiento esperado (ver `CLAUDE.md` §5c).

## Calidad

```bash
npm run typecheck   # tsc -b
npm test            # vitest
npm run lint        # oxlint
npm run build       # tsc -b && vite build
npm run db:push         # aplica migraciones + seed al proyecto Supabase vinculado
npm run db:types        # regenera src/types/database.ts
npm run db:verify       # 21 checks de RLS/RPC contra el proyecto
npm run db:verify:staff # 7 checks de cierre de mesa y aislamiento por tenant
```

## Flujo de la demo

1. **Comensal (Mesa 4)** → buscá/filtrá platos, elegí tamaño y extras, agregá notas y confirmá.
   En **Mis pedidos** seguís el estado (Recibido → En cocina → Listo → Entregado) y ves **La cuenta**.
   *Llamar al Mozo* / *Pedir la Cuenta* avisan al salón.
2. **Mozo** → ve las alertas y las marca como atendidas; revisa cada comanda entrante,
   ajusta cantidades/notas, la envía a cocina (o la cancela) y marca los pedidos listos como entregados.
   En la pestaña **Mesas** ve el panorama por sector (libre / abierta / pidió la cuenta) con el total acumulado
   y puede cerrar una mesa una vez que no quedan pedidos sin entregar.
3. **Cocina** → tickets ordenados por antigüedad con color según urgencia
   (verde < 8 min, ámbar 8–15, rojo > 15) y las notas resaltadas. *Marcar como Listo* avisa al mozo y al comensal.
4. **Administración** → cargá categorías y platos (con foto, tags y variantes tipo "Tamaño"/"Extras"), marcá
   un plato "agotado hoy" o cambiá su precio sin salir de la lista, dale de alta sectores y mesas y descargá
   el QR de cada una (o la hoja completa para imprimir), invitá gente al equipo con un código y asignale
   sectores o mesas puntuales, y personalizá el nombre, el logo, la moneda y el color de marca del restaurante.

## Estructura

Ver [`CLAUDE.md`](CLAUDE.md) §4 (estructura), §5 (modelo de estado) y §6 (convenciones).
Roadmap y decisiones de producto en [`docs/plan-producto.md`](docs/plan-producto.md).
