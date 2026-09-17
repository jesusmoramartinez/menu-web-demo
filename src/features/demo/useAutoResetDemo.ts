import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { shouldAutoReset } from '@/lib/shouldAutoReset'
import { resetDemo } from '@/services/demo'
import type { Restaurant } from '@/types/domain'

/**
 * Red de seguridad client-side para el reset horario de la demo: si `pg_cron`
 * no está activo en el proyecto (no hay forma de confirmarlo sin el dashboard,
 * ver CLAUDE.md), el primer visitante que entra después de una hora dispara el
 * reset él mismo. No reemplaza al cron — sólo cubre el caso de que no exista.
 */
export function useAutoResetDemo(restaurant: Restaurant | null | undefined): void {
  const queryClient = useQueryClient()
  const triedRef = useRef(false)

  useEffect(() => {
    if (!restaurant?.isDemo || !restaurant.createdAt || triedRef.current) return
    if (!shouldAutoReset(restaurant.createdAt)) return

    triedRef.current = true
    resetDemo()
      .then(() => queryClient.invalidateQueries())
      .catch(() => {
        triedRef.current = false // no pudo: que lo reintente el próximo que entre
      })
  }, [restaurant, queryClient])
}
