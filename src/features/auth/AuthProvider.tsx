import type { Session } from '@supabase/supabase-js'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { getSession, onAuthStateChange, signOut } from '@/services/auth'
import { AuthContext, type AuthContextValue } from './auth-context'

/** Sesión de Supabase Auth, disponible para toda la app (staff real; el comensal y la demo no la usan). */
export function AuthProvider({ children }: { children: ReactNode }) {
  // undefined = todavía no resolvimos la sesión inicial
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    let active = true
    getSession()
      .then((s) => {
        if (active) setSession(s)
      })
      .catch(() => {
        if (active) setSession(null)
      })
    const unsubscribe = onAuthStateChange((s) => {
      if (active) setSession(s)
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ session: session ?? null, userId: session?.user.id ?? null, loading: session === undefined, signOut }),
    [session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
