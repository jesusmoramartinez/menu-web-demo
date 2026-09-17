import { useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { countUnits, sumLines } from '@/lib/format'
import { RestaurantContext, type RestaurantActions, type RestaurantDerived } from './restaurant-context'
import { initialState, restaurantReducer, type RestaurantState } from './restaurantReducer'

/** v2: sin `view` ni `toast`, precios en centavos. Subir la versión si cambia la forma del estado. */
const STORAGE_KEY = 'don-remolo-demo-v2'

function loadState(): RestaurantState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState
    const parsed = JSON.parse(raw) as Partial<RestaurantState>
    if (!Array.isArray(parsed.orders) || !Array.isArray(parsed.cart)) return initialState
    return { ...initialState, ...parsed }
  } catch {
    return initialState
  }
}

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(restaurantReducer, undefined, loadState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* modo privado o cuota llena: la demo sigue funcionando en memoria */
    }
  }, [state])

  const actions = useMemo<RestaurantActions>(
    () => ({
      setTable: (table) => dispatch({ type: 'SET_TABLE', table }),
      addToCart: (item) => dispatch({ type: 'CART_ADD', item }),
      setCartQty: (itemId, qty) => dispatch({ type: 'CART_SET_QTY', itemId, qty }),
      setCartNotes: (itemId, notes) => dispatch({ type: 'CART_SET_NOTES', itemId, notes }),
      clearCart: () => dispatch({ type: 'CART_CLEAR' }),
      submitOrder: () => dispatch({ type: 'ORDER_SUBMIT' }),
      updateOrderItems: (orderId, items) => dispatch({ type: 'ORDER_UPDATE_ITEMS', orderId, items }),
      sendToKitchen: (orderId) => dispatch({ type: 'ORDER_SEND_TO_KITCHEN', orderId }),
      markOrderDone: (orderId) => dispatch({ type: 'ORDER_MARK_DONE', orderId }),
      deleteOrder: (orderId) => dispatch({ type: 'ORDER_DELETE', orderId }),
      addAlert: (table, alertType) => dispatch({ type: 'ALERT_ADD', table, alertType }),
      resolveAlert: (alertId) => dispatch({ type: 'ALERT_RESOLVE', alertId }),
      resetDemo: () => dispatch({ type: 'RESET_DEMO' }),
    }),
    [],
  )

  const derived = useMemo<RestaurantDerived>(() => {
    const kitchenOrders = state.orders
      .filter((o) => o.status === 'kitchen')
      .sort((a, b) => (a.sentToKitchenAt ?? 0) - (b.sentToKitchenAt ?? 0))
    return {
      cartTotal: sumLines(state.cart),
      cartCount: countUnits(state.cart),
      pendingOrders: state.orders.filter((o) => o.status === 'pending'),
      kitchenOrders,
      doneOrders: state.orders.filter((o) => o.status === 'done'),
    }
  }, [state.cart, state.orders])

  const value = useMemo(() => ({ ...state, ...derived, ...actions }), [state, derived, actions])

  return <RestaurantContext.Provider value={value}>{children}</RestaurantContext.Provider>
}
