import { createContext, type Dispatch } from 'react'
import type { TableContext } from '@/types/domain'
import type { CartAction, CartState } from './cartReducer'

export interface ClientContextValue {
  /** token del QR (identifica la mesa) */
  token: string
  table: TableContext
  /** sesión de mesa conocida por este dispositivo (null hasta el primer pedido/llamado) */
  sessionId: string | null
  setSessionId: (id: string | null) => void
  cart: CartState
  dispatch: Dispatch<CartAction>
}

export const ClientContext = createContext<ClientContextValue | null>(null)

export const storageKeys = {
  session: (token: string) => `menu:session:${token}`,
  cart: (token: string) => `menu:cart:${token}`,
}
