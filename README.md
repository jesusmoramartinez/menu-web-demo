# 🍕 Menú Digital para Restaurantes (SaaS) — demo "Pizzería Don Remolo"

Menú digital con QR por mesa y comandas en tiempo real. Tres roles en una sola app:
**Cliente** (menú + carrito + notas), **Mozo** (alertas + revisión de comandas) y
**Cocina** (KDS con tiempos, urgencia y notas resaltadas).

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
- `/demo/m/demo-mesa-04` (comensal) · `/demo/mozo` · `/demo/cocina` — el tenant demo funciona sin login y en tiempo real; abrilos en distintas pestañas o dispositivos
- `/r/<slug>/m/<token>` — URL que va en el QR de cada mesa de un restaurante real
- El botón ↻ de la barra reinicia la demo (también se reinicia sola cada hora)

## Calidad

```bash
npm run typecheck   # tsc -b
npm test            # vitest
npm run lint        # oxlint
npm run build       # tsc -b && vite build
npm run db:push     # aplica migraciones + seed al proyecto Supabase vinculado
npm run db:types    # regenera src/types/database.ts
npm run db:verify   # 21 checks de RLS/RPC contra el proyecto
```

## Flujo de la demo

1. **Comensal (Mesa 4)** → buscá/filtrá platos, elegí tamaño y extras, agregá notas y confirmá.
   En **Mis pedidos** seguís el estado (Recibido → En cocina → Listo → Entregado) y ves **La cuenta**.
   *Llamar al Mozo* / *Pedir la Cuenta* avisan al salón.
2. **Mozo** → ve las alertas y las marca como atendidas; revisa cada comanda entrante,
   ajusta cantidades/notas, la envía a cocina (o la cancela) y marca los pedidos listos como entregados.
3. **Cocina** → tickets ordenados por antigüedad con color según urgencia
   (verde < 8 min, ámbar 8–15, rojo > 15) y las notas resaltadas. *Marcar como Listo* avisa al mozo y al comensal.

## Estructura

Ver [`CLAUDE.md`](CLAUDE.md) §4 (estructura), §5 (modelo de estado) y §6 (convenciones).
Roadmap y decisiones de producto en [`docs/plan-producto.md`](docs/plan-producto.md).
