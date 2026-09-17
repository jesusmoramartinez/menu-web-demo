import { AlertTriangle, CheckCheck, Timer } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { minutesSince } from '@/lib/format'
import type { StaffOrder } from '@/types/domain'
import { urgency } from './urgency'

interface KitchenTicketProps {
  order: StaffOrder
  now: number
  index: number
  onReady: () => void
  busy?: boolean
}

export function KitchenTicket({ order, now, index, onReady, busy }: KitchenTicketProps) {
  const since = new Date(order.sentToKitchenAt ?? order.createdAt).getTime()
  const min = minutesSince(since, now)
  const u = urgency(min)
  const hasNotes = order.items.some((i) => i.notes)

  return (
    <article className={`flex flex-col rounded-2xl border-t-8 ${u.border} bg-white shadow-md`} aria-label={`Comanda mesa ${order.tableNumber}, ${u.label}`}>
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-900 text-sm font-bold text-white">{index + 1}</span>
          <p className="text-xl font-extrabold">Mesa {order.tableLabel ?? order.tableNumber}</p>
        </div>
        <div className={`flex items-center gap-1 rounded-full ${u.badge} px-2.5 py-1 text-sm font-bold text-white tabular-nums`}>
          <Timer size={14} aria-hidden="true" />
          {min < 1 ? '<1' : min} min
        </div>
      </div>

      {hasNotes && (
        <div className="mx-4 mb-2 flex items-center gap-1.5 rounded-lg bg-yellow-100 px-2.5 py-1.5 text-xs font-bold text-yellow-900 ring-1 ring-yellow-300">
          <AlertTriangle size={14} aria-hidden="true" /> Esta comanda tiene notas especiales
        </div>
      )}

      <ul className="flex-1 divide-y divide-stone-100 px-4">
        {order.items.map((i) => (
          <li key={i.id} className="py-2.5">
            <div className="flex items-start gap-3">
              <span className="min-w-8 text-2xl leading-none font-extrabold text-stone-900 tabular-nums">{i.qty}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-snug">{i.name}</p>
                {i.selectedOptions.length > 0 && (
                  <p className="mt-0.5 text-sm font-medium text-stone-600">{i.selectedOptions.map((o) => o.optionName).join(' · ')}</p>
                )}
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
        <Button variant="success" size="lg" full icon={<CheckCheck size={20} />} onClick={onReady} disabled={busy} className="shadow-lg shadow-emerald-600/30">
          Marcar como Listo
        </Button>
      </div>
    </article>
  )
}
