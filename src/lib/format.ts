/** Monedas que en la práctica se muestran sin decimales. */
const ZERO_DECIMAL = new Set(['ARS', 'CLP', 'COP', 'PYG', 'JPY', 'KRW'])
const formatters = new Map<string, Intl.NumberFormat>()

/** Formatea un importe en centavos según la moneda (y locale) del restaurante. */
export function formatPrice(cents: number, currency = 'ARS', locale = 'es-AR'): string {
  const key = `${locale}:${currency}`
  let fmt = formatters.get(key)
  if (!fmt) {
    const digits = ZERO_DECIMAL.has(currency) ? 0 : 2
    fmt = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })
    formatters.set(key, fmt)
  }
  return fmt.format(cents / 100)
}

/** "recién", "hace 3 min", "hace 1 h 12 min" */
export function timeAgo(timestamp: number, now = Date.now()): string {
  const diff = Math.max(0, Math.floor((now - timestamp) / 1000))
  if (diff < 60) return 'recién'
  const min = Math.floor(diff / 60)
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  const rest = min % 60
  return rest ? `hace ${h} h ${rest} min` : `hace ${h} h`
}

/** "en 3 días", "en 1 h", "hoy", "vencida" — para fechas futuras (p. ej. el vencimiento de una invitación). */
export function timeUntil(timestamp: number, now = Date.now()): string {
  const diff = Math.floor((timestamp - now) / 1000)
  if (diff <= 0) return 'vencida'
  const min = Math.floor(diff / 60)
  if (min < 60) return 'hoy'
  const h = Math.floor(min / 60)
  if (h < 24) return `en ${h} h`
  const days = Math.floor(h / 24)
  return `en ${days} ${plural(days, 'día', 'días')}`
}

/** Minutos enteros transcurridos (para colorear tarjetas de cocina). */
export function minutesSince(timestamp: number, now = Date.now()): number {
  return Math.floor((now - timestamp) / 60_000)
}

/** Suma de líneas (precio × cantidad), en centavos. */
export function sumLines(items: ReadonlyArray<{ price: number; qty: number }>): number {
  return items.reduce((s, i) => s + i.price * i.qty, 0)
}

export function countUnits(items: ReadonlyArray<{ qty: number }>): number {
  return items.reduce((s, i) => s + i.qty, 0)
}

export function plural(n: number, singular: string, pluralForm: string): string {
  return n === 1 ? singular : pluralForm
}
