import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { SEED_ALERTS, SEED_ORDERS } from '../data/seed'
import { uid } from '../utils/format'

const STORAGE_KEY = 'don-remolo-state-v1'

const RestaurantContext = createContext(null)

// ─────────────────────────────────────────────────────────────
// Estado inicial
// ─────────────────────────────────────────────────────────────
const initialState = {
  view: 'client', // 'client' | 'waiter' | 'kitchen'
  table: 4,
  cart: [], // [{ itemId, name, price, qty, notes }]
  orders: SEED_ORDERS,
  alerts: SEED_ALERTS, // [{ id, table, type: 'waiter' | 'bill', createdAt }]
  toast: null, // { id, message, tone }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState
    const parsed = JSON.parse(raw)
    return { ...initialState, ...parsed, toast: null }
  } catch {
    return initialState
  }
}

// ─────────────────────────────────────────────────────────────
// Reducer
// ─────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, view: action.view }

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

    case 'CART_SET_QTY': {
      const cart = state.cart
        .map((c) => (c.itemId === action.itemId ? { ...c, qty: action.qty } : c))
        .filter((c) => c.qty > 0)
      return { ...state, cart }
    }

    case 'CART_SET_NOTES':
      return {
        ...state,
        cart: state.cart.map((c) =>
          c.itemId === action.itemId ? { ...c, notes: action.notes } : c,
        ),
      }

    case 'CART_CLEAR':
      return { ...state, cart: [] }

    // ── Pedidos ───────────────────────────────────────────
    case 'ORDER_SUBMIT': {
      if (state.cart.length === 0) return state
      const order = {
        id: uid('ord'),
        table: state.table,
        status: 'pending',
        createdAt: Date.now(),
        sentToKitchenAt: null,
        items: state.cart.map((c) => ({ ...c })),
      }
      return { ...state, cart: [], orders: [order, ...state.orders] }
    }

    case 'ORDER_UPDATE_ITEMS':
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.orderId ? { ...o, items: action.items } : o,
        ),
      }

    case 'ORDER_SEND_TO_KITCHEN':
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.orderId
            ? { ...o, status: 'kitchen', sentToKitchenAt: Date.now() }
            : o,
        ),
      }

    case 'ORDER_MARK_DONE':
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.orderId ? { ...o, status: 'done', doneAt: Date.now() } : o,
        ),
      }

    case 'ORDER_DELETE':
      return { ...state, orders: state.orders.filter((o) => o.id !== action.orderId) }

    // ── Alertas (llamar mozo / pedir cuenta) ──────────────
    case 'ALERT_ADD': {
      // Evita duplicar la misma alerta para la misma mesa
      const dup = state.alerts.some((a) => a.table === action.table && a.type === action.alertType)
      if (dup) return state
      const alert = { id: uid('alert'), table: action.table, type: action.alertType, createdAt: Date.now() }
      return { ...state, alerts: [alert, ...state.alerts] }
    }

    case 'ALERT_RESOLVE':
      return { ...state, alerts: state.alerts.filter((a) => a.id !== action.alertId) }

    // ── Toast ─────────────────────────────────────────────
    case 'TOAST_SHOW':
      return { ...state, toast: { id: uid('toast'), message: action.message, tone: action.tone ?? 'success' } }

    case 'TOAST_HIDE':
      return { ...state, toast: null }

    case 'RESET_DEMO':
      return { ...initialState, view: state.view }

    default:
      return state
  }
}

// ─────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────
export function RestaurantProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  // Persistencia en LocalStorage (excepto el toast, que es efímero)
  useEffect(() => {
    // eslint-disable-next-line no-unused-vars
    const { toast, ...persistable } = state
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable))
  }, [state])

  // Auto-ocultar toast
  useEffect(() => {
    if (!state.toast) return
    const t = setTimeout(() => dispatch({ type: 'TOAST_HIDE' }), 2800)
    return () => clearTimeout(t)
  }, [state.toast])

  const actions = useMemo(
    () => ({
      setView: (view) => dispatch({ type: 'SET_VIEW', view }),
      setTable: (table) => dispatch({ type: 'SET_TABLE', table }),

      addToCart: (item) => {
        dispatch({ type: 'CART_ADD', item })
        dispatch({ type: 'TOAST_SHOW', message: `${item.name} agregado` })
      },
      setCartQty: (itemId, qty) => dispatch({ type: 'CART_SET_QTY', itemId, qty }),
      setCartNotes: (itemId, notes) => dispatch({ type: 'CART_SET_NOTES', itemId, notes }),
      clearCart: () => dispatch({ type: 'CART_CLEAR' }),

      submitOrder: () => {
        dispatch({ type: 'ORDER_SUBMIT' })
        dispatch({ type: 'TOAST_SHOW', message: '¡Pedido enviado! El mozo lo revisará enseguida.' })
      },
      updateOrderItems: (orderId, items) => dispatch({ type: 'ORDER_UPDATE_ITEMS', orderId, items }),
      sendToKitchen: (orderId) => {
        dispatch({ type: 'ORDER_SEND_TO_KITCHEN', orderId })
        dispatch({ type: 'TOAST_SHOW', message: 'Comanda enviada a cocina 👨‍🍳' })
      },
      markOrderDone: (orderId) => {
        dispatch({ type: 'ORDER_MARK_DONE', orderId })
        dispatch({ type: 'TOAST_SHOW', message: 'Pedido marcado como listo ✅' })
      },
      deleteOrder: (orderId) => dispatch({ type: 'ORDER_DELETE', orderId }),

      callWaiter: (table) => {
        dispatch({ type: 'ALERT_ADD', table, alertType: 'waiter' })
        dispatch({ type: 'TOAST_SHOW', message: 'Mozo en camino 🙋‍♂️', tone: 'info' })
      },
      requestBill: (table) => {
        dispatch({ type: 'ALERT_ADD', table, alertType: 'bill' })
        dispatch({ type: 'TOAST_SHOW', message: 'Cuenta solicitada 🧾', tone: 'info' })
      },
      resolveAlert: (alertId) => dispatch({ type: 'ALERT_RESOLVE', alertId }),

      showToast: (message, tone) => dispatch({ type: 'TOAST_SHOW', message, tone }),
      resetDemo: () => {
        dispatch({ type: 'RESET_DEMO' })
        dispatch({ type: 'TOAST_SHOW', message: 'Demo reiniciada', tone: 'info' })
      },
    }),
    [],
  )

  // Valores derivados
  const derived = useMemo(() => {
    const cartTotal = state.cart.reduce((s, c) => s + c.price * c.qty, 0)
    const cartCount = state.cart.reduce((s, c) => s + c.qty, 0)
    const pendingOrders = state.orders.filter((o) => o.status === 'pending')
    const kitchenOrders = state.orders
      .filter((o) => o.status === 'kitchen')
      .sort((a, b) => a.sentToKitchenAt - b.sentToKitchenAt)
    const doneOrders = state.orders.filter((o) => o.status === 'done')
    return { cartTotal, cartCount, pendingOrders, kitchenOrders, doneOrders }
  }, [state.cart, state.orders])

  const value = useMemo(() => ({ ...state, ...derived, ...actions }), [state, derived, actions])

  return <RestaurantContext.Provider value={value}>{children}</RestaurantContext.Provider>
}

export function useRestaurant() {
  const ctx = useContext(RestaurantContext)
  if (!ctx) throw new Error('useRestaurant debe usarse dentro de <RestaurantProvider>')
  return ctx
}
