const currency = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

export const formatPrice = (n) => currency.format(n)

/** "hace 3 min", "hace 1 h 12 min", "recién" */
export const timeAgo = (timestamp, now = Date.now()) => {
  const diff = Math.max(0, Math.floor((now - timestamp) / 1000))
  if (diff < 60) return 'recién'
  const min = Math.floor(diff / 60)
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  const rest = min % 60
  return rest ? `hace ${h} h ${rest} min` : `hace ${h} h`
}

/** Minutos enteros transcurridos, para colorear tarjetas de cocina. */
export const minutesSince = (timestamp, now = Date.now()) =>
  Math.floor((now - timestamp) / 60_000)

export const uid = (prefix = 'id') =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
