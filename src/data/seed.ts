import type { Alert, CartItem, Order } from '@/types/domain'
import { MENU_ITEMS } from './menu'

const line = (id: string, qty: number, notes = ''): CartItem => {
  const item = MENU_ITEMS.find((m) => m.id === id)
  if (!item) throw new Error(`Seed: plato inexistente ${id}`)
  return { itemId: item.id, name: item.name, price: item.price, qty, notes }
}

const minutesAgo = (m: number) => Date.now() - m * 60_000

/**
 * Pedidos iniciales para que el mozo y la cocina tengan algo que mostrar
 * en la primera ejecución de la demo.
 */
export const SEED_ORDERS: Order[] = [
  {
    id: 'ord-seed-1',
    table: 2,
    status: 'kitchen',
    createdAt: minutesAgo(14),
    sentToKitchenAt: minutesAgo(12),
    items: [line('p2', 1, 'Sin ajo, por favor'), line('b2', 2), line('e1', 1)],
  },
  {
    id: 'ord-seed-2',
    table: 7,
    status: 'kitchen',
    createdAt: minutesAgo(6),
    sentToKitchenAt: minutesAgo(4),
    items: [line('p3', 1), line('p4', 1, 'Bien picante 🔥'), line('b1', 1), line('d3', 2, 'Uno sin helado')],
  },
  {
    id: 'ord-seed-3',
    table: 11,
    status: 'pending',
    createdAt: minutesAgo(2),
    sentToKitchenAt: null,
    items: [line('e2', 2, 'Una porción sin aceitunas'), line('p1', 1), line('b3', 3, 'Dos Zero y una regular')],
  },
]

export const SEED_ALERTS: Alert[] = [{ id: 'alert-seed-1', table: 9, type: 'bill', createdAt: minutesAgo(3) }]
