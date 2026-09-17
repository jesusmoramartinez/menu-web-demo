import { Minus, Plus, Send, ShoppingBag, Trash2, X } from 'lucide-react'
import { useEffect } from 'react'
import { useRestaurant } from '../../context/RestaurantContext'
import { formatPrice } from '../../utils/format'

export default function CartDrawer({ open, onClose }) {
  const { cart, cartTotal, cartCount, table, setCartQty, setCartNotes, clearCart, submitOrder } =
    useRestaurant()

  // Cierra con Escape y bloquea el scroll del fondo
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const handleSubmit = () => {
    submitOrder()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onClose} />

      <div className="relative flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-white shadow-2xl animate-slide-up sm:max-w-lg sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-brand-600" />
            <div>
              <h2 className="font-bold">Tu pedido</h2>
              <p className="text-xs text-stone-500">Mesa {table} · {cartCount} {cartCount === 1 ? 'ítem' : 'ítems'}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-stone-500 hover:bg-stone-100" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cart.length === 0 ? (
            <div className="py-12 text-center">
              <ShoppingBag size={40} className="mx-auto mb-3 text-stone-300" />
              <p className="font-semibold text-stone-700">Tu carrito está vacío</p>
              <p className="mt-1 text-sm text-stone-500">Agregá platos desde el menú.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {cart.map((c) => (
                <li key={c.itemId} className="rounded-2xl bg-stone-50 p-3 ring-1 ring-stone-200/70">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-tight">{c.name}</p>
                      <p className="text-xs text-stone-500">{formatPrice(c.price)} c/u</p>
                    </div>
                    <p className="font-bold">{formatPrice(c.price * c.qty)}</p>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <QtyControl qty={c.qty} onChange={(q) => setCartQty(c.itemId, q)} />
                    <button
                      onClick={() => setCartQty(c.itemId, 0)}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-stone-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={14} /> Quitar
                    </button>
                  </div>

                  <input
                    type="text"
                    value={c.notes}
                    onChange={(e) => setCartNotes(c.itemId, e.target.value)}
                    placeholder='Notas: "sin cebolla", "salsa aparte"…'
                    className="mt-2 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t border-stone-200 px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-stone-500">Total</span>
              <span className="text-2xl font-bold">{formatPrice(cartTotal)}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={clearCart}
                className="rounded-xl px-4 py-3 text-sm font-medium text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50"
              >
                Vaciar
              </button>
              <button
                onClick={handleSubmit}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 px-3 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition active:scale-[0.98] hover:bg-brand-600 sm:text-base"
              >
                <Send size={18} className="shrink-0" /> Confirmar y Enviar Pedido
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function QtyControl({ qty, onChange, size = 'md' }) {
  const btn = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9'
  return (
    <div className="inline-flex items-center rounded-full bg-white ring-1 ring-stone-300">
      <button onClick={() => onChange(qty - 1)} className={`${btn} flex items-center justify-center rounded-full text-stone-700 hover:bg-stone-100`} aria-label="Menos">
        <Minus size={14} />
      </button>
      <span className="min-w-8 text-center text-sm font-bold tabular-nums">{qty}</span>
      <button onClick={() => onChange(qty + 1)} className={`${btn} flex items-center justify-center rounded-full text-stone-700 hover:bg-stone-100`} aria-label="Más">
        <Plus size={14} />
      </button>
    </div>
  )
}
