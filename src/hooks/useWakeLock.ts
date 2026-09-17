import { useEffect, useRef, useState } from 'react'

/**
 * Mantiene la pantalla encendida (Wake Lock API) mientras `active` es true —
 * pensado para la pantalla de cocina, que suele quedar montada en una tablet
 * fija todo el turno. El wake lock se libera solo cuando la pestaña se oculta;
 * lo volvemos a pedir al recuperar el foco. Sin soporte (navegador viejo,
 * Safari < 16.4): `supported` queda en false y no hace nada.
 */
export function useWakeLock(active: boolean): { supported: boolean } {
  const [supported] = useState(() => typeof navigator !== 'undefined' && 'wakeLock' in navigator)
  const lockRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (!supported || !active) return

    let cancelled = false
    const request = async () => {
      try {
        const lock = await navigator.wakeLock.request('screen')
        if (cancelled) {
          void lock.release()
          return
        }
        lockRef.current = lock
      } catch {
        /* el navegador lo rechazó (poco batería, política, etc.): no es crítico */
      }
    }

    void request()
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !lockRef.current) void request()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      void lockRef.current?.release()
      lockRef.current = null
    }
  }, [active, supported])

  return { supported }
}
