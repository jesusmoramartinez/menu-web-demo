/**
 * Tipos de dominio compartidos por toda la UI.
 * Todos los importes están en CENTAVOS (integer) — ver lib/format.ts.
 */

export interface Category {
  id: string
  label: string
  emoji: string
}

export type MenuTag = 'Popular' | 'Vegetariano' | 'Picante' | 'Chef' | 'Sin alcohol'

export interface MenuItem {
  id: string
  category: string
  name: string
  description: string
  /** Precio unitario en centavos */
  price: number
  image: string
  tags: MenuTag[]
}

/** Línea de carrito / de pedido. `price` es un snapshot del momento de agregar. */
export interface CartItem {
  itemId: string
  name: string
  price: number
  qty: number
  notes: string
}

export type OrderStatus = 'pending' | 'kitchen' | 'done'

export interface Order {
  id: string
  table: number
  status: OrderStatus
  createdAt: number
  sentToKitchenAt: number | null
  doneAt?: number
  items: CartItem[]
}

export type AlertType = 'waiter' | 'bill'

export interface Alert {
  id: string
  table: number
  type: AlertType
  createdAt: number
}

export type ToastTone = 'success' | 'info' | 'error'
