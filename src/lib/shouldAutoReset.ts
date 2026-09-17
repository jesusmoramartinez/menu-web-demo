/** true si `createdAt` tiene más de 65 minutos (lógica pura de useAutoResetDemo). */
export function shouldAutoReset(createdAt: string, now: number = Date.now()): boolean {
  const MAX_AGE_MS = 65 * 60_000
  return now - new Date(createdAt).getTime() >= MAX_AGE_MS
}
