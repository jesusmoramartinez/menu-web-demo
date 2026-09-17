import { ChefHat, MessageSquare, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRestaurant } from '../../context/RestaurantContext'
import { formatPrice } from '../../utils/format'
import { QtyControl } from '../client/CartDrawer'

/**
 * El mozo revisa la comanda: puede ajustar cantidades, editar las notas
 * del cliente o quitar ítems antes de enviarla a cocina.
 */
export default function OrderEditModal({ order, onClose }) {
  const { updateOrderItems, sendToKitchen, deleteOrder } = useRestaurant()
  // Copia local: los cambios se guardan sólo al confirmar
  const [items, setItems] = useState(() => order.items.map((i) => ({ ...i })))

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const setQty = (itemId, qty) =>
    setItems((prev) => prev.map((i) => (i.itemId === itemId ? { ...i, qty } : i)).filter((i) => i.qty > 0))

  const setNotes = (itemId, notes) =>
    setItems((prev) => prev.map((i) => (i.itemId === itemId ? { ...i, notes } : i)))

  const total = items.reduce((s, i) => s + i.price * i.qty, 0)

  const handleSave = () => {
    updateOrderItems(order.id, items)
    onClose()
  }

  const handleSend = () => {
    updateOrderItems(order.id, items)
    sendToKitchen(order.id)
    onClose()
  }

  const handleDelete = () => {
    if (window.confirm(`¿Eliminar la comanda de la Mesa ${order.table}?`)) {
      deleteOrder(order.id)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onClose} />

      <div className="relative flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-white shadow-2xl animate-slide-up sm:max-w-lg sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold">Comanda · Mesa {order.table}</h2>
            <p className="text-xs text-stone-500">Revisá y ajustá antes de enviar a cocina</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-stone-500 hover:bg-stone-100" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
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
                      <p className="text-xs text-stone-500">{formatPrice(i.price)} c/u</p>
                    </div>
                    <p className="font-bold">{formatPrice(i.price * i.qty)}</p>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <QtyControl qty={i.qty} onChange={(q) => setQty(i.itemId, q)} size="sm" />
                    <button
                      onClick={() => setQty(i.itemId, 0)}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-stone-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={14} /> Quitar
                    </button>
                  </div>

                  <label className="relative mt-2 block">
                    <MessageSquare size={14} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-stone-400" />
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
        </div>

        <div className="border-t border-stone-200 px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-stone-500">Total comanda</span>
            <span className="text-xl font-bold">{formatPrice(total)}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              className="rounded-xl p-3 text-red-600 ring-1 ring-red-200 hover:bg-red-50"
              title="Eliminar comanda"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={handleSave}
              disabled={items.length === 0}
              className="rounded-xl px-4 py-3 text-sm font-medium text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50 disabled:opacity-40"
            >
              Guardar
            </button>
            <button
              onClick={handleSend}
              disabled={items.length === 0}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-3 text-sm font-semibold whitespace-nowrap text-white shadow-lg shadow-emerald-600/30 transition active:scale-[0.98] hover:bg-emerald-700 disabled:opacity-40 sm:text-base"
            >
              <ChefHat size={18} className="shrink-0" /> Enviar a Cocina
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
