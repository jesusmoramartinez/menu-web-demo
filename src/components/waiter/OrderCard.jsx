import { ChefHat, Clock, MessageSquare, Pencil } from 'lucide-react'
import { formatPrice, timeAgo } from '../../utils/format'

const STATUS = {
  pending: { label: 'Por revisar', cls: 'bg-amber-100 text-amber-800' },
  kitchen: { label: 'En cocina', cls: 'bg-sky-100 text-sky-800' },
  done: { label: 'Entregado', cls: 'bg-emerald-100 text-emerald-800' },
}

export default function OrderCard({ order, now, onEdit, onSend }) {
  const total = order.items.reduce((s, i) => s + i.price * i.qty, 0)
  const count = order.items.reduce((s, i) => s + i.qty, 0)
  const status = STATUS[order.status]
  const editable = order.status === 'pending'

  return (
    <article className="flex flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200/70">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lg font-bold">Mesa {order.table}</p>
          <p className="flex items-center gap-1 text-xs text-stone-500">
            <Clock size={12} /> {timeAgo(order.createdAt, now)} · {count} {count === 1 ? 'ítem' : 'ítems'}
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
              <span className="text-stone-500 tabular-nums">{formatPrice(i.price * i.qty)}</span>
            </div>
            {i.notes && (
              <p className="mt-0.5 flex items-start gap-1 text-xs text-amber-700">
                <MessageSquare size={12} className="mt-0.5 shrink-0" /> {i.notes}
              </p>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3">
        <span className="font-bold">{formatPrice(total)}</span>
        {editable && (
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50"
            >
              <Pencil size={14} /> Editar
            </button>
            <button
              onClick={onSend}
              className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold whitespace-nowrap text-white shadow-sm transition active:scale-95 hover:bg-emerald-700"
            >
              <ChefHat size={14} /> A cocina
            </button>
          </div>
        )}
      </div>
    </article>
  )
}
