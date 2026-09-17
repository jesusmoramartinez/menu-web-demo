import { useCallback, useEffect, useState } from 'react'
import { unlockAudio } from '@/lib/sound'

const KEY = 'menu:sound-enabled'

const read = (): boolean => {
  try {
    return localStorage.getItem(KEY) !== 'false' // default: activado
  } catch {
    return true
  }
}

/**
 * Preferencia de sonido (por dispositivo, vía localStorage) + desbloqueo del
 * audio en el primer toque de la pantalla, como exigen los navegadores.
 */
export function useSoundPreference(): { enabled: boolean; toggle: () => void } {
  const [enabled, setEnabled] = useState(read)

  useEffect(() => {
    if (!enabled) return
    const onFirstGesture = () => unlockAudio()
    window.addEventListener('pointerdown', onFirstGesture, { once: true })
    return () => window.removeEventListener('pointerdown', onFirstGesture)
  }, [enabled])

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev
      try {
        localStorage.setItem(KEY, String(next))
      } catch {
        /* modo privado: la preferencia no persiste, pero funciona en esta sesión */
      }
      if (next) unlockAudio()
      return next
    })
  }, [])

  return { enabled, toggle }
}
