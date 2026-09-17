import { Send, ShoppingBag, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Modal'
import { QtyControl } from '@/components/ui/QtyControl'
import { RESTAURANT } from '@/data/menu'
import { useRestaurant } from '@/hooks/useRestaurant'
import { useToast } from '@/hooks/useToast'
import { formatPrice, plural } from '@/lib/format'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { cart, cartTotal, cartCount, table, setCartQty, setCartNotes, clearCart, submitOrder } = useRestaurant()
  const toast = useToast()
  const currency = RESTAURANT.currency

  const handleSubmit = () => {
    submitOrder()
    toast.show('¡Pedido enviado! El mozo lo revisará enseguida.')
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      icon={<ShoppingBag size={20} className="text-brand-600" aria-hidden="true" />}
      title="Tu pedido"
      subtitle={`Mesa ${table} · ${cartCount} ${plural(cartCount, 'ítem', 'ítems')}`}
      footer={
        cart.length > 0 && (
          <>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-stone-500">Total</span>
              <span className="text-2xl font-bold">{formatPrice(cartTotal, currency)}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="lg" onClick={clearCart}>
                Vaciar
              </Button>
              <Button size="lg" full icon={<Send size={18} />} onClick={handleSubmit} className="flex-1 shadow-lg shadow-brand-500/30">
                Confirmar y Enviar Pedido
              </Button>
            </div>
          </>
        )
      }
    >
      {cart.length === 0 ? (
        <div className="py-12 text-center">
          <ShoppingBag size={40} className="mx-auto mb-3 text-stone-300" aria-hidden="true" />
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
                  <p className="text-xs text-stone-500">{formatPrice(c.price, currency)} c/u</p>
                </div>
                <p className="font-bold">{formatPrice(c.price * c.qty, currency)}</p>
              </div>

              <div className="mt-2 flex items-center justify-between gap-3">
                <QtyControl qty={c.qty} onChange={(q) => setCartQty(c.itemId, q)} />
                <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => setCartQty(c.itemId, 0)}>
                  Quitar
                </Button>
              </div>

              <label className="mt-2 block">
                <span className="sr-only">Notas para {c.name}</span>
                <input
                  type="text"
                  value={c.notes}
                  onChange={(e) => setCartNotes(c.itemId, e.target.value)}
                  placeholder='Notas: "sin cebolla", "salsa aparte"…'
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </label>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  )
}
