/**
 * Aviso sonoro + vibración para el mozo/cocina cuando llega algo nuevo (alerta o
 * comanda). Los navegadores bloquean el audio hasta el primer gesto del usuario:
 * `unlockAudio()` se llama en el primer click/touch de la pantalla (ver
 * `useUnlockAudioOnGesture`) y deja el AudioContext listo para sonar sin gesto
 * después (mientras la pestaña siga abierta).
 */
let ctx: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!ctx) ctx = new Ctor()
  return ctx
}

/** Desbloquea el audio: llamar en un handler de click/touch (una vez alcanza). */
export function unlockAudio(): void {
  const c = getContext()
  if (c?.state === 'suspended') void c.resume()
}

/** Un tono corto y limpio, sin necesidad de archivos de audio. */
function beep(freq: number, startAt: number, duration = 0.14, gainPeak = 0.18): void {
  const c = getContext()
  if (!c) return
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0, c.currentTime + startAt)
  gain.gain.linearRampToValueAtTime(gainPeak, c.currentTime + startAt + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + startAt + duration)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(c.currentTime + startAt)
  osc.stop(c.currentTime + startAt + duration + 0.02)
}

/** Dos notas ascendentes — "llegó algo nuevo". */
export function playAlertSound(): void {
  const c = getContext()
  if (!c || c.state === 'suspended') return // sin desbloquear todavía: no forzamos el resume acá
  beep(660, 0)
  beep(880, 0.15)
}

export function vibrate(pattern: number | number[] = [120, 60, 120]): void {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* no soportado: no pasa nada */
  }
}

/** Sonido + vibración juntos, el aviso estándar de "llegó algo nuevo". */
export function notifyNewItem(): void {
  playAlertSound()
  vibrate()
}
