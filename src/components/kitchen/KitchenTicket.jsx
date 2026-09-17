import { AlertTriangle, CheckCheck, Timer } from 'lucide-react'
import { useRestaurant } from '../../context/RestaurantContext'
import { minutesSince } from '../../utils/format'

/** Colores según urgencia: <8 min verde, 8-15 ámbar, >15 rojo */
const urgency = (min) => {
  if (min >= 15) return { border: 'border-red-500', badge: 'bg-red-500', label: 'Urgente' }
  if (min >= 8) return { border: 'border-amber-400', badge: 'bg-amber-500', label: 'Atención' }
  return { border: 'border-emerald-500', badge: 'bg-emerald-600', label: 'A tiempo' }
}

export default function KitchenTicket({ order, now, index }) {
  const { markOrderDone } = useRestaurant()
  const min = minutesSince(order.sentToKitchenAt, now)
  const u = urgency(min)
  const hasNotes = order.items.some((i) => i.notes)

  return (
    <article className={`flex flex-col rounded-2xl border-t-8 ${u.border} bg-white shadow-md`}>
      {/* Cabecera */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-900 text-sm font-bold text-white">
            {index + 1}
          </span>
          <p className="text-xl font-extrabold">Mesa {order.table}</p>
        </div>
        <div className={`flex items-center gap-1 rounded-full ${u.badge} px-2.5 py-1 text-sm font-bold text-white tabular-nums`}>
          <Timer size={14} />
          {min < 1 ? '<1' : min} min
        </div>
      </div>

      {hasNotes && (
        <div className="mx-4 mb-2 flex items-center gap-1.5 rounded-lg bg-yellow-100 px-2.5 py-1.5 text-xs font-bold text-yellow-900 ring-1 ring-yellow-300">
          <AlertTriangle size={14} /> Esta comanda tiene notas especiales
        </div>
      )}

      {/* Platos */}
      <ul className="flex-1 divide-y divide-stone-100 px-4">
        {order.items.map((i) => (
          <li key={i.itemId} className="py-2.5">
            <div className="flex items-start gap-3">
              <span className="min-w-8 text-2xl leading-none font-extrabold text-stone-900 tabular-nums">
                {i.qty}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-snug">{i.name}</p>
                {i.notes && (
                  <p className="mt-1 inline-block rounded-md bg-yellow-200 px-2 py-1 text-sm font-bold text-yellow-900 ring-1 ring-yellow-400">
                    ⚠ {i.notes}
                  </p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="p-3">
        <button
          onClick={() => markOrderDone(order.id)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-base font-bold text-white shadow-lg shadow-emerald-600/30 transition active:scale-[0.98] hover:bg-emerald-700"
        >
          <CheckCheck size={20} /> Marcar como Listo / Entregado
        </button>
      </div>
    </article>
  )
}
