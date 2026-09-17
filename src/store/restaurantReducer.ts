import { SEED_ALERTS, SEED_ORDERS } from '@/data/seed'
import { uid } from '@/lib/uid'
import type { Alert, AlertType, CartItem, MenuItem, Order } from '@/types/domain'

/**
 * Estado global de la DEMO (un solo navegador, persistido en localStorage).
 * En la Fase 2 este reducer queda reducido al carrito; pedidos y alertas pasan a Supabase.
 */
export interface RestaurantState {
  table: number
  cart: CartItem[]
  orders: Order[]
  alerts: Alert[]
}

export type RestaurantAction =
  | { type: 'SET_TABLE'; table: number }
  | { type: 'CART_ADD'; item: MenuItem }
  | { type: 'CART_SET_QTY'; itemId: string; qty: number }
  | { type: 'CART_SET_NOTES'; itemId: string; notes: string }
  | { type: 'CART_CLEAR' }
  | { type: 'ORDER_SUBMIT'; now?: number }
  | { type: 'ORDER_UPDATE_ITEMS'; orderId: string; items: CartItem[] }
  | { type: 'ORDER_SEND_TO_KITCHEN'; orderId: string; now?: number }
  | { type: 'ORDER_MARK_DONE'; orderId: string; now?: number }
  | { type: 'ORDER_DELETE'; orderId: string }
  | { type: 'ALERT_ADD'; table: number; alertType: AlertType; now?: number }
  | { type: 'ALERT_RESOLVE'; alertId: string }
  | { type: 'RESET_DEMO' }

export const initialState: RestaurantState = {
  table: 4,
  cart: [],
  orders: SEED_ORDERS,
  alerts: SEED_ALERTS,
}

const updateOrder = (orders: Order[], id: string, patch: (o: Order) => Order) =>
  orders.map((o) => (o.id === id ? patch(o) : o))

export function restaurantReducer(state: RestaurantState, action: RestaurantAction): RestaurantState {
  switch (action.type) {
    case 'SET_TABLE':
      return { ...state, table: action.table }

    // ── Carrito ───────────────────────────────────────────
    case 'CART_ADD': {
      const { item } = action
      const existing = state.cart.find((c) => c.itemId === item.id)
      const cart = existing
        ? state.cart.map((c) => (c.itemId === item.id ? { ...c, qty: c.qty + 1 } : c))
        : [...state.cart, { itemId: item.id, name: item.name, price: item.price, qty: 1, notes: '' }]
      return { ...state, cart }
    }

    case 'CART_SET_QTY':
      return {
        ...state,
        cart: state.cart
          .map((c) => (c.itemId === action.itemId ? { ...c, qty: action.qty } : c))
          .filter((c) => c.qty > 0),
      }

    case 'CART_SET_NOTES':
      return {
        ...state,
        cart: state.cart.map((c) => (c.itemId === action.itemId ? { ...c, notes: action.notes } : c)),
      }

    case 'CART_CLEAR':
      return { ...state, cart: [] }

    // ── Pedidos ───────────────────────────────────────────
    case 'ORDER_SUBMIT': {
      if (state.cart.length === 0) return state
      const order: Order = {
        id: uid('ord'),
        table: state.table,
        status: 'pending',
        createdAt: action.now ?? Date.now(),
        sentToKitchenAt: null,
        items: state.cart.map((c) => ({ ...c })),
      }
      return { ...state, cart: [], orders: [order, ...state.orders] }
    }

    case 'ORDER_UPDATE_ITEMS':
      return { ...state, orders: updateOrder(state.orders, action.orderId, (o) => ({ ...o, items: action.items })) }

    case 'ORDER_SEND_TO_KITCHEN':
      return {
        ...state,
        orders: updateOrder(state.orders, action.orderId, (o) => ({
          ...o,
          status: 'kitchen',
          sentToKitchenAt: action.now ?? Date.now(),
        })),
      }

    case 'ORDER_MARK_DONE':
      return {
        ...state,
        orders: updateOrder(state.orders, action.orderId, (o) => ({
          ...o,
          status: 'done',
          doneAt: action.now ?? Date.now(),
        })),
      }

    case 'ORDER_DELETE':
      return { ...state, orders: state.orders.filter((o) => o.id !== action.orderId) }

    // ── Alertas (llamar mozo / pedir cuenta) ──────────────
    case 'ALERT_ADD': {
      const dup = state.alerts.some((a) => a.table === action.table && a.type === action.alertType)
      if (dup) return state
      const alert: Alert = {
        id: uid('alert'),
        table: action.table,
        type: action.alertType,
        createdAt: action.now ?? Date.now(),
      }
      return { ...state, alerts: [alert, ...state.alerts] }
    }

    case 'ALERT_RESOLVE':
      return { ...state, alerts: state.alerts.filter((a) => a.id !== action.alertId) }

    case 'RESET_DEMO':
      return initialState

    default:
      return state
  }
}
