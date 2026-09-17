import { useContext } from 'react'
import { ClientContext, type ClientContextValue } from './client-context'

export function useClient(): ClientContextValue {
  const ctx = useContext(ClientContext)
  if (!ctx) throw new Error('useClient debe usarse dentro de <ClientProvider>')
  return ctx
}
