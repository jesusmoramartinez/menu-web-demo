import { createContext } from 'react'
import type { AlertType, CartItem, MenuItem, Order } from '@/types/domain'
import type { RestaurantState } from './restaurantReducer'

export interface RestaurantDerived {
  cartTotal: number
  cartCount: number
  pendingOrders: Order[]
  kitchenOrders: Order[]
  doneOrders: Order[]
}

export interface RestaurantActions {
  setTable(table: number): void
  addToCart(item: MenuItem): void
  setCartQty(itemId: string, qty: number): void
  setCartNotes(itemId: string, notes: string): void
  clearCart(): void
  submitOrder(): void
  updateOrderItems(orderId: string, items: CartItem[]): void
  sendToKitchen(orderId: string): void
  markOrderDone(orderId: string): void
  deleteOrder(orderId: string): void
  addAlert(table: number, type: AlertType): void
  resolveAlert(alertId: string): void
  resetDemo(): void
}

export type RestaurantContextValue = RestaurantState & RestaurantDerived & RestaurantActions

export const RestaurantContext = createContext<RestaurantContextValue | null>(null)
