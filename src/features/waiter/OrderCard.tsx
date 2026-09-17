import { Clock, MessageSquare } from 'lucide-react'
import type { ReactNode } from 'react'
import { formatPrice, plural, timeAgo } from '@/lib/format'
import type { OrderStatus, StaffOrder } from '@/types/domain'

const STATUS_BADGE: Record<OrderStatus, { label: string; cls: string }> = {
  pending: { label: 'Por revisar', cls: 'bg-amber-100 text-amber-800' },
  kitchen: { label: 'En cocina', cls: 'bg-sky-100 text-sky-800' },
  ready: { label: 'Listo', cls: 'bg-emerald-100 text-emerald-800' },
  delivered: { label: 'Entregado', cls: 'bg-stone-200 text-stone-700' },
  cancelled: { label: 'Cancelado', cls: 'bg-red-100 text-red-800' },
}

interface OrderCardProps {
  order: StaffOrder
  now: number
  currency: string
  /** botones de acción según la sección (los define la vista) */
  actions?: ReactNode
}

export function OrderCard({ order, now, currency, actions }: OrderCardProps) {
  const count = order.items.reduce((s, i) => s + i.qty, 0)
  const badge = STATUS_BADGE[order.status]

  return (
    <article className="flex flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200/70" aria-label={`Comanda mesa ${order.tableNumber}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lg font-bold">Mesa {order.tableLabel ?? order.tableNumber}</p>
          <p className="flex items-center gap-1 text-xs text-stone-500">
            <Clock size={12} aria-hidden="true" /> {timeAgo(new Date(order.createdAt).getTime(), now)} · {count} {plural(count, 'ítem', 'ítems')}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
      </div>

      <ul className="mt-3 space-y-1.5 text-sm">
        {order.items.map((i) => (
          <li key={i.id}>
            <div className="flex justify-between gap-2">
              <span>
                <span className="font-bold text-stone-900">{i.qty}×</span> {i.name}
                {i.selectedOptions.length > 0 && (
                  <span className="block text-xs text-stone-500">{i.selectedOptions.map((o) => o.optionName).join(' · ')}</span>
                )}
              </span>
              <span className="text-stone-500 tabular-nums">{formatPrice(i.lineTotal, currency)}</span>
            </div>
            {i.notes && (
              <p className="mt-0.5 flex items-start gap-1 text-xs text-amber-700">
                <MessageSquare size={12} className="mt-0.5 shrink-0" aria-hidden="true" /> {i.notes}
              </p>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3">
        <span className="font-bold">{formatPrice(order.total, currency)}</span>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </article>
  )
}
