import { BellRing, ChefHat, ClipboardList, Inbox, Pencil, Truck } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { CardsSkeleton } from '@/components/ui/Skeleton'
import { useRestaurantScope } from '@/features/staff/useRestaurantScope'
import { useActiveOrders, useOpenAlerts } from '@/hooks/useQueries'
import { useStaffMutations } from '@/hooks/useStaffMutations'
import { useToast } from '@/hooks/useToast'
import { useNow } from '@/lib/useNow'
import type { StaffOrder } from '@/types/domain'
import { AlertsPanel } from './AlertsPanel'
import { OrderCard } from './OrderCard'
import { OrderEditModal } from './OrderEditModal'

export default function WaiterView() {
  const { restaurant } = useRestaurantScope()
  const orders = useActiveOrders(restaurant.id)
  const alerts = useOpenAlerts(restaurant.id)
  const { setStatus, resolve } = useStaffMutations(restaurant.id)
  const toast = useToast()
  const [editing, setEditing] = useState<StaffOrder | null>(null)
  const now = useNow(10_000)
  const currency = restaurant.currency

  const pending = orders.data?.filter((o) => o.status === 'pending') ?? []
  const ready = orders.data?.filter((o) => o.status === 'ready') ?? []
  const inKitchen = orders.data?.filter((o) => o.status === 'kitchen') ?? []

  const sendToKitchen = (orderId: string) =>
    setStatus.mutate({ orderId, status: 'kitchen' }, { onSuccess: () => toast.show('Comanda enviada a cocina 👨‍🍳') })
  const markDelivered = (orderId: string) =>
    setStatus.mutate({ orderId, status: 'delivered' }, { onSuccess: () => toast.show('Pedido entregado ✅') })

  return (
    <div className="min-h-dvh">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <h1 className="text-xl font-bold">Panel del Mozo</h1>
          <p className="text-sm text-stone-500">{restaurant.name} · llamados de mesa y comandas</p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-5">
        {alerts.isError ? (
          <ErrorState error={alerts.error} onRetry={() => alerts.refetch()} title="No pudimos cargar las alertas" />
        ) : (
          <AlertsPanel alerts={alerts.data ?? []} now={now} onResolve={(id) => resolve.mutate(id)} resolving={resolve.isPending} />
        )}

        <Section id="pending" icon={<Inbox size={18} className="text-amber-500" aria-hidden="true" />} title="Pedidos entrantes" count={pending.length} tone="bg-amber-500">
          {orders.isPending ? (
            <CardsSkeleton />
          ) : orders.isError ? (
            <ErrorState error={orders.error} onRetry={() => orders.refetch()} title="No pudimos cargar las comandas" />
          ) : pending.length === 0 ? (
            <EmptyState icon={Inbox} title="No hay comandas por revisar" subtitle="Cuando una mesa confirme un pedido, aparecerá aquí." />
          ) : (
            <Grid>
              {pending.map((o) => (
                <OrderCard
                  key={o.id}
                  order={o}
                  now={now}
                  currency={currency}
                  actions={
                    <>
                      <Button variant="secondary" size="sm" icon={<Pencil size={14} />} onClick={() => setEditing(o)}>
                        Editar
                      </Button>
                      <Button variant="success" size="sm" icon={<ChefHat size={14} />} onClick={() => sendToKitchen(o.id)} disabled={setStatus.isPending}>
                        A cocina
                      </Button>
                    </>
                  }
                />
              ))}
            </Grid>
          )}
        </Section>

        {ready.length > 0 && (
          <Section id="ready" icon={<BellRing size={18} className="text-emerald-600" aria-hidden="true" />} title="Listos para entregar" count={ready.length} tone="bg-emerald-600">
            <Grid>
              {ready.map((o) => (
                <OrderCard
                  key={o.id}
                  order={o}
                  now={now}
                  currency={currency}
                  actions={
                    <Button variant="success" size="sm" icon={<Truck size={14} />} onClick={() => markDelivered(o.id)} disabled={setStatus.isPending}>
                      Entregado
                    </Button>
                  }
                />
              ))}
            </Grid>
          </Section>
        )}

        {inKitchen.length > 0 && (
          <Section id="kitchen" icon={<ClipboardList size={18} aria-hidden="true" />} title="En cocina" count={inKitchen.length} tone="bg-sky-600" muted>
            <Grid className="opacity-80">
              {inKitchen.map((o) => (
                <OrderCard key={o.id} order={o} now={now} currency={currency} />
              ))}
            </Grid>
          </Section>
        )}
      </main>

      {editing && (
        <OrderEditModal key={editing.id} order={editing} restaurantId={restaurant.id} currency={currency} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}

function Section({
  id,
  icon,
  title,
  count,
  tone,
  muted,
  children,
}: {
  id: string
  icon: ReactNode
  title: string
  count: number
  tone: string
  muted?: boolean
  children: ReactNode
}) {
  return (
    <section aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className={`mb-3 flex items-center gap-2 text-lg font-bold ${muted ? 'text-stone-600' : ''}`}>
        {icon} {title}
        {count > 0 && <span className={`rounded-full ${tone} px-2 py-0.5 text-xs font-bold text-white`}>{count}</span>}
      </h2>
      {children}
    </section>
  )
}

function Grid({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>{children}</div>
}
