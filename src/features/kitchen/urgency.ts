/** Colores según urgencia de una comanda en cocina: <8 min verde, 8-15 ámbar, >15 rojo. */
export function urgency(min: number) {
  if (min >= 15) return { border: 'border-red-500', badge: 'bg-red-500', label: 'Urgente' }
  if (min >= 8) return { border: 'border-amber-400', badge: 'bg-amber-500', label: 'Atención' }
  return { border: 'border-emerald-500', badge: 'bg-emerald-600', label: 'A tiempo' }
}
