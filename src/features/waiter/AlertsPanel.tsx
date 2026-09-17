import { Bell, BellOff, Check, Receipt, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { timeAgo } from '@/lib/format'
import type { AlertType, StaffAlert } from '@/types/domain'

const ALERT_META: Record<AlertType, { label: string; Icon: LucideIcon; ring: string; bg: string; iconBg: string }> = {
  waiter: { label: 'Llama al mozo', Icon: Bell, ring: 'ring-red-300', bg: 'bg-red-50', iconBg: 'bg-red-500' },
  bill: { label: 'Pide la cuenta', Icon: Receipt, ring: 'ring-sky-300', bg: 'bg-sky-50', iconBg: 'bg-sky-600' },
}

interface AlertsPanelProps {
  alerts: StaffAlert[]
  now: number
  onResolve: (alertId: string) => void
  resolving?: boolean
}

export function AlertsPanel({ alerts, now, onResolve, resolving }: AlertsPanelProps) {
  return (
    <section aria-labelledby="alerts-title">
      <h2 id="alerts-title" className="mb-3 flex items-center gap-2 text-lg font-bold">
        <Bell size={18} className="text-red-500" aria-hidden="true" /> Notificaciones activas
        {alerts.length > 0 && (
          <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">{alerts.length}</span>
        )}
      </h2>

      {alerts.length === 0 ? (
        <EmptyState icon={BellOff} title="Sin llamados pendientes" subtitle="Todo tranquilo por ahora." />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {alerts.map((a) => {
            const meta = ALERT_META[a.type]
            return (
              <li key={a.id} className={`flex items-center gap-3 rounded-2xl ${meta.bg} p-3 ring-2 ${meta.ring} animate-fade-in`}>
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${meta.iconBg} text-white`}>
                  <meta.Icon size={22} className="animate-pulse" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">Mesa {a.tableLabel ?? a.tableNumber}</p>
                  <p className="text-sm text-stone-600">
                    {meta.label} · <span className="text-stone-500">{timeAgo(new Date(a.createdAt).getTime(), now)}</span>
                  </p>
                </div>
                <Button variant="secondary" icon={<Check size={16} />} onClick={() => onResolve(a.id)} disabled={resolving}>
                  Atendido
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
