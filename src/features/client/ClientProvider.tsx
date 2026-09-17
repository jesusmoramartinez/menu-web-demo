import { useCallback, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react'
import type { TableContext } from '@/types/domain'
import { cartReducer, emptyCart, type CartState } from './cartReducer'
import { ClientContext, storageKeys, type ClientContextValue } from './client-context'

const readJSON = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
const writeJSON = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* modo privado o sin cuota */
  }
}

interface ClientProviderProps {
  token: string
  table: TableContext
  children: ReactNode
}

/**
 * Estado del comensal en este dispositivo: sesión de mesa conocida y carrito,
 * ambos persistidos por token para sobrevivir a una recarga.
 *
 * La sesión efectiva es la que la mesa tiene abierta en el servidor (compartida por
 * todos los celulares de la mesa); si no hay, la última conocida por este dispositivo.
 */
export function ClientProvider({ token, table, children }: ClientProviderProps) {
  const [localSessionId, setLocalSessionId] = useState<string | null>(() =>
    readJSON<string | null>(storageKeys.session(token), null),
  )
  const [cart, dispatch] = useReducer(cartReducer, undefined, () => readJSON<CartState>(storageKeys.cart(token), emptyCart))

  const sessionId = table.session?.id ?? localSessionId

  useEffect(() => {
    if (sessionId) writeJSON(storageKeys.session(token), sessionId)
    else localStorage.removeItem(storageKeys.session(token))
  }, [token, sessionId])

  useEffect(() => {
    writeJSON(storageKeys.cart(token), cart)
  }, [token, cart])

  const setSessionId = useCallback((id: string | null) => setLocalSessionId(id), [])

  const value = useMemo<ClientContextValue>(
    () => ({ token, table, sessionId, setSessionId, cart, dispatch }),
    [token, table, sessionId, setSessionId, cart],
  )

  return <ClientContext.Provider value={value}>{children}</ClientContext.Provider>
}
