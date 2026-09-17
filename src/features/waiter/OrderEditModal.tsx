import { ChefHat, MessageSquare, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Sheet } from '@/components/ui/Modal'
import { QtyControl } from '@/components/ui/QtyControl'
import { RESTAURANT } from '@/data/menu'
import { useRestaurant } from '@/hooks/useRestaurant'
import { useToast } from '@/hooks/useToast'
import { formatPrice, sumLines } from '@/lib/format'
import type { CartItem, Order } from '@/types/domain'

interface OrderEditModalProps {
  order: Order
  onClose: () => void
}

/**
 * El mozo revisa la comanda: ajusta cantidades, edita las notas del cliente
 * o quita ítems antes de enviarla a cocina. Trabaja sobre una copia local.
 */
export function OrderEditModal({ order, onClose }: OrderEditModalProps) {
  const { updateOrderItems, sendToKitchen, deleteOrder } = useRestaurant()
  const toast = useToast()
  const [items, setItems] = useState<CartItem[]>(() => order.items.map((i) => ({ ...i })))
  const [confirmDelete, setConfirmDelete] = useState(false)
  const currency = RESTAURANT.currency

  const setQty = (itemId: string, qty: number) =>
    setItems((prev) => prev.map((i) => (i.itemId === itemId ? { ...i, qty } : i)).filter((i) => i.qty > 0))

  const setNotes = (itemId: string, notes: string) =>
    setItems((prev) => prev.map((i) => (i.itemId === itemId ? { ...i, notes } : i)))

  const handleSave = () => {
    updateOrderItems(order.id, items)
    toast.show('Comanda guardada', 'info')
    onClose()
  }

  const handleSend = () => {
    updateOrderItems(order.id, items)
    sendToKitchen(order.id)
    toast.show('Comanda enviada a cocina 👨‍🍳')
    onClose()
  }

  const handleDelete = () => {
    deleteOrder(order.id)
    toast.show('Comanda eliminada', 'info')
    onClose()
  }

  return (
    <>
      <Sheet
        open
        onClose={onClose}
        title={`Comanda · Mesa ${order.table}`}
        subtitle="Revisá y ajustá antes de enviar a cocina"
        footer={
          <>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-stone-500">Total comanda</span>
              <span className="text-xl font-bold">{formatPrice(sumLines(items), currency)}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="danger" size="lg" aria-label="Eliminar comanda" onClick={() => setConfirmDelete(true)} className="px-3">
                <Trash2 size={18} />
              </Button>
              <Button variant="secondary" size="lg" disabled={items.length === 0} onClick={handleSave}>
                Guardar
              </Button>
              <Button
                variant="success"
                size="lg"
                icon={<ChefHat size={18} />}
                disabled={items.length === 0}
                onClick={handleSend}
                className="flex-1 shadow-lg shadow-emerald-600/30"
              >
                Enviar a Cocina
              </Button>
            </div>
          </>
        }
      >
        {items.length === 0 ? (
          <p className="py-10 text-center text-sm text-stone-500">
            La comanda quedó vacía. Podés eliminarla o cerrar sin guardar.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((i) => (
              <li key={i.itemId} className="rounded-2xl bg-stone-50 p-3 ring-1 ring-stone-200/70">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-tight">{i.name}</p>
                    <p className="text-xs text-stone-500">{formatPrice(i.price, currency)} c/u</p>
                  </div>
                  <p className="font-bold">{formatPrice(i.price * i.qty, currency)}</p>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <QtyControl qty={i.qty} onChange={(q) => setQty(i.itemId, q)} size="sm" />
                  <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => setQty(i.itemId, 0)}>
                    Quitar
                  </Button>
                </div>

                <label className="relative mt-2 block">
                  <span className="sr-only">Notas para {i.name}</span>
                  <MessageSquare
                    size={14}
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-stone-400"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    value={i.notes}
                    onChange={(e) => setNotes(i.itemId, e.target.value)}
                    placeholder="Notas para cocina…"
                    className="w-full rounded-lg border border-stone-200 bg-white py-2 pr-3 pl-8 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  />
                </label>
              </li>
            ))}
          </ul>
        )}
      </Sheet>

      <ConfirmDialog
        open={confirmDelete}
        tone="danger"
        title={`¿Eliminar la comanda de la Mesa ${order.table}?`}
        description="Esta acción no se puede deshacer. El cliente no recibirá aviso."
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  )
}
