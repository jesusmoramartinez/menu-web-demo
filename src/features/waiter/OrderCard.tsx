import { ChefHat, Clock, MessageSquare, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { RESTAURANT } from '@/data/menu'
import { countUnits, formatPrice, plural, sumLines, timeAgo } from '@/lib/format'
import type { Order, OrderStatus } from '@/types/domain'

const STATUS: Record<OrderStatus, { label: string; cls: string }> = {
  pending: { label: 'Por revisar', cls: 'bg-amber-100 text-amber-800' },
  kitchen: { label: 'En cocina', cls: 'bg-sky-100 text-sky-800' },
  done: { label: 'Entregado', cls: 'bg-emerald-100 text-emerald-800' },
}

interface OrderCardProps {
  order: Order
  now: number
  onEdit?: () => void
  onSend?: () => void
}

export function OrderCard({ order, now, onEdit, onSend }: OrderCardProps) {
  const total = sumLines(order.items)
  const count = countUnits(order.items)
  const status = STATUS[order.status]
  const editable = order.status === 'pending' && onEdit && onSend
  const currency = RESTAURANT.currency

  return (
    <article className="flex flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200/70">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lg font-bold">Mesa {order.table}</p>
          <p className="flex items-center gap-1 text-xs text-stone-500">
            <Clock size={12} aria-hidden="true" /> {timeAgo(order.createdAt, now)} · {count} {plural(count, 'ítem', 'ítems')}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.cls}`}>{status.label}</span>
      </div>

      <ul className="mt-3 space-y-1.5 text-sm">
        {order.items.map((i) => (
          <li key={i.itemId}>
            <div className="flex justify-between gap-2">
              <span>
                <span className="font-bold text-stone-900">{i.qty}×</span> {i.name}
              </span>
              <span className="text-stone-500 tabular-nums">{formatPrice(i.price * i.qty, currency)}</span>
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
        <span className="font-bold">{formatPrice(total, currency)}</span>
        {editable && (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" icon={<Pencil size={14} />} onClick={onEdit}>
              Editar
            </Button>
            <Button variant="success" size="sm" icon={<ChefHat size={14} />} onClick={onSend}>
              A cocina
            </Button>
          </div>
        )}
      </div>
    </article>
  )
}
