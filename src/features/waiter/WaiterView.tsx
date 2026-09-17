import { ClipboardList, Inbox } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { useRestaurant } from '@/hooks/useRestaurant'
import { useToast } from '@/hooks/useToast'
import { useNow } from '@/lib/useNow'
import type { Order } from '@/types/domain'
import { AlertsPanel } from './AlertsPanel'
import { OrderCard } from './OrderCard'
import { OrderEditModal } from './OrderEditModal'

export default function WaiterView() {
  const { pendingOrders, kitchenOrders, doneOrders, sendToKitchen } = useRestaurant()
  const toast = useToast()
  const [editing, setEditing] = useState<Order | null>(null)
  const now = useNow(10_000)

  const handleSend = (orderId: string) => {
    sendToKitchen(orderId)
    toast.show('Comanda enviada a cocina 👨‍🍳')
  }

  return (
    <div className="min-h-dvh">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <h1 className="text-xl font-bold">Panel del Mozo</h1>
          <p className="text-sm text-stone-500">Llamados de mesa y comandas entrantes</p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-5">
        <AlertsPanel />

        <section aria-labelledby="pending-title">
          <h2 id="pending-title" className="mb-3 flex items-center gap-2 text-lg font-bold">
            <Inbox size={18} className="text-amber-500" aria-hidden="true" /> Pedidos entrantes
            {pendingOrders.length > 0 && (
              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                {pendingOrders.length}
              </span>
            )}
          </h2>
          {pendingOrders.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No hay comandas por revisar"
              subtitle="Cuando una mesa confirme un pedido, aparecerá aquí."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pendingOrders.map((o) => (
                <OrderCard key={o.id} order={o} now={now} onEdit={() => setEditing(o)} onSend={() => handleSend(o.id)} />
              ))}
            </div>
          )}
        </section>

        {(kitchenOrders.length > 0 || doneOrders.length > 0) && (
          <section aria-labelledby="history-title">
            <h2 id="history-title" className="mb-3 flex items-center gap-2 text-lg font-bold text-stone-600">
              <ClipboardList size={18} aria-hidden="true" /> En cocina y entregados
            </h2>
            <div className="grid gap-3 opacity-80 sm:grid-cols-2 lg:grid-cols-3">
              {[...kitchenOrders, ...doneOrders].map((o) => (
                <OrderCard key={o.id} order={o} now={now} />
              ))}
            </div>
          </section>
        )}
      </main>

      {editing && <OrderEditModal key={editing.id} order={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
