# 🍕 Pizzería Don Remolo · Menú Digital Interactivo (Demo)

Prototipo de menú digital de restaurante con tres roles en una sola app:
**Cliente** (menú + carrito), **Mozo** (alertas + revisión de comandas) y
**Cocina** (KDS con tiempos y notas destacadas).

Stack: **React 19 + Vite 8 + Tailwind CSS 4 + lucide-react**. Sin backend:
todo el estado vive en un `useReducer` global y se persiste en `localStorage`.

## Correr el proyecto

```bash
npm install
npm run dev
```

Abrí `http://localhost:5173`. Usá el selector superior para alternar entre vistas.
El botón ↻ de la barra reinicia la demo con los datos de prueba.

## Flujo de la demo

1. **Cliente (Mesa 4)** → buscá/filtrá platos, agregá al carrito, escribí notas por plato
   ("sin cebolla") y confirmá el pedido. También podés *Llamar al Mozo* o *Pedir la Cuenta*.
2. **Mozo** → ve las alertas activas y las marca como atendidas. Abre cada comanda
   entrante, ajusta cantidades/notas y la envía a cocina.
3. **Cocina** → tarjetas ordenadas por antigüedad con color según urgencia
   (verde < 8 min, ámbar 8–15, rojo > 15). Las notas se resaltan en amarillo.
   *Marcar como Listo* la retira de la pantalla.

## Estructura

```
src/
├── App.jsx                     # Enruta la vista activa
├── context/RestaurantContext.jsx  # Estado global (reducer + localStorage + acciones)
├── data/
│   ├── menu.js                 # Categorías y platos (mock)
│   └── seed.js                 # Pedidos y alertas iniciales
├── utils/
│   ├── format.js               # formatPrice, timeAgo, uid…
│   └── useNow.js               # Reloj reactivo para "tiempo transcurrido"
└── components/
    ├── ViewSwitcher.jsx        # Barra Cliente / Mozo / Cocina con badges
    ├── Toast.jsx
    ├── EmptyState.jsx
    ├── client/                 # ClientView, ClientHeader, MenuFilters, MenuItemCard, CartDrawer
    ├── waiter/                 # WaiterView, AlertsPanel, OrderCard, OrderEditModal
    └── kitchen/                # KitchenView, KitchenTicket
```

## Estados de un pedido

`pending` (enviado por el cliente) → `kitchen` (aprobado por el mozo) → `done` (listo en cocina).
