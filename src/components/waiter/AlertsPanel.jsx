import { Bell, BellOff, Check, Receipt } from 'lucide-react'
import { useRestaurant } from '../../context/RestaurantContext'
import { timeAgo } from '../../utils/format'
import { useNow } from '../../utils/useNow'
import EmptyState from '../EmptyState'

const ALERT_META = {
  waiter: {
    label: 'Llama al mozo',
    Icon: Bell,
    ring: 'ring-red-300',
    bg: 'bg-red-50',
    iconBg: 'bg-red-500',
  },
  bill: {
    label: 'Pide la cuenta',
    Icon: Receipt,
    ring: 'ring-sky-300',
    bg: 'bg-sky-50',
    iconBg: 'bg-sky-600',
  },
}

export default function AlertsPanel() {
  const { alerts, resolveAlert } = useRestaurant()
  const now = useNow(10_000)

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
        <Bell size={18} className="text-red-500" /> Notificaciones activas
        {alerts.length > 0 && (
          <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
            {alerts.length}
          </span>
        )}
      </h2>

      {alerts.length === 0 ? (
        <EmptyState icon={BellOff} title="Sin llamados pendientes" subtitle="Todo tranquilo por ahora." />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {alerts.map((a) => {
            const meta = ALERT_META[a.type]
            return (
              <li
                key={a.id}
                className={`flex items-center gap-3 rounded-2xl ${meta.bg} p-3 ring-2 ${meta.ring} animate-fade-in`}
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${meta.iconBg} text-white`}>
                  <meta.Icon size={22} className="animate-pulse" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">Mesa {a.table}</p>
                  <p className="text-sm text-stone-600">
                    {meta.label} · <span className="text-stone-500">{timeAgo(a.createdAt, now)}</span>
                  </p>
                </div>
                <button
                  onClick={() => resolveAlert(a.id)}
                  className="flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-stone-800 shadow-sm ring-1 ring-stone-200 transition active:scale-95 hover:bg-stone-50"
                >
                  <Check size={16} /> Atendido
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
