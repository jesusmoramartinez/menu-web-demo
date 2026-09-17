# 🍕 Menú Digital para Restaurantes (SaaS) — demo "Pizzería Don Remolo"

Menú digital con QR por mesa y comandas en tiempo real. Tres roles en una sola app:
**Cliente** (menú + carrito + notas), **Mozo** (alertas + revisión de comandas) y
**Cocina** (KDS con tiempos, urgencia y notas resaltadas).

Stack: **React 19 · Vite 8 · TypeScript · Tailwind CSS 4 · react-router 7 · lucide-react · Vitest**.
Backend previsto: **Supabase** (ver [`docs/plan-producto.md`](docs/plan-producto.md)).

## Correr el proyecto

```bash
npm install
npm run dev
```

Abrí `http://localhost:5173`:

- `/` landing con acceso a la demo
- `/demo/cliente` · `/demo/mozo` · `/demo/cocina` — las tres vistas sobre un store local (misma pestaña/navegador)
- El botón ↻ de la barra reinicia la demo con los datos de prueba

## Calidad

```bash
npm run typecheck   # tsc -b
npm test            # vitest
npm run lint        # oxlint
npm run build       # tsc -b && vite build
```

## Flujo de la demo

1. **Cliente (Mesa 4)** → buscá/filtrá platos, agregá al carrito, escribí notas por plato
   ("sin cebolla") y confirmá el pedido. También podés *Llamar al Mozo* o *Pedir la Cuenta*.
2. **Mozo** → ve las alertas activas y las marca como atendidas. Abre cada comanda
   entrante, ajusta cantidades/notas y la envía a cocina (o la elimina).
3. **Cocina** → tarjetas ordenadas por antigüedad con color según urgencia
   (verde < 8 min, ámbar 8–15, rojo > 15). *Marcar como Listo* la retira de la pantalla.

## Estructura

Ver [`CLAUDE.md`](CLAUDE.md) §4 (estructura), §5 (modelo de estado) y §6 (convenciones).
Roadmap y decisiones de producto en [`docs/plan-producto.md`](docs/plan-producto.md).
