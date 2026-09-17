import { createRestaurant, joinRestaurant } from '@/services/auth'

const KEY = 'menu:pending-setup'

export type PendingSetup = { type: 'invite'; code: string; displayName: string } | { type: 'restaurant'; name: string; slug: string }

/**
 * Guarda qué hacer apenas haya sesión: el usuario puede tener que confirmar su
 * email primero, así que la acción (canjear invitación / crear restaurante) se
 * guarda para completarse cuando vuelva del link de confirmación.
 */
export function savePendingSetup(setup: PendingSetup): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(setup))
  } catch {
    /* modo privado o sin cuota: el usuario va a tener que reintentar a mano */
  }
}

export function readPendingSetup(): PendingSetup | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as PendingSetup) : null
  } catch {
    return null
  }
}

export function clearPendingSetup(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* noop */
  }
}

export interface ConsumeResult {
  role: string
}

/** Ejecuta la acción pendiente (si hay una) contra la sesión ya autenticada. Limpia el storage al terminar. */
export async function consumePendingSetup(): Promise<ConsumeResult | null> {
  const pending = readPendingSetup()
  if (!pending) return null
  try {
    if (pending.type === 'invite') {
      const r = await joinRestaurant(pending.code, pending.displayName)
      return { role: r.role }
    }
    await createRestaurant(pending.name, pending.slug)
    return { role: 'owner' }
  } finally {
    clearPendingSetup()
  }
}
