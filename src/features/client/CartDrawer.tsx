import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, ShoppingBag, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Modal'
import { QtyControl } from '@/components/ui/QtyControl'
import { useToast } from '@/hooks/useToast'
import { toAppError } from '@/lib/errors'
import { formatPrice, plural } from '@/lib/format'
import { qk } from '@/lib/queryKeys'
import { placeOrder } from '@/services/orders'
import { cartCount, cartTotal } from './cartReducer'
import { useClient } from './useClient'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
  /** se llama con el pedido ya confirmado (para saltar a "Mis pedidos") */
  onOrdered: () => void
}

export function CartDrawer({ open, onClose, onOrdered }: CartDrawerProps) {
  const { token, table, cart, dispatch, setSessionId } = useClient()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const currency = table.restaurant.currency
  const count = cartCount(cart)

  const submit = useMutation({
    mutationFn: () =>
      placeOrder(
        token,
        cart.lines.map((l) => ({ menu_item_id: l.itemId, qty: l.qty, notes: l.notes, option_ids: l.optionIds })),
      ),
    onSuccess: (result) => {
      setSessionId(result.sessionId)
      dispatch({ type: 'CLEAR' })
      void queryClient.invalidateQueries({ queryKey: qk.session(result.sessionId) })
      void queryClient.invalidateQueries({ queryKey: qk.tableByToken(token) })
      toast.show('¡Pedido enviado! El mozo lo revisará enseguida.')
      setError(null)
      onClose()
      onOrdered()
    },
    onError: (err) => {
      const e = toAppError(err, 'No pudimos enviar el pedido. Probá de nuevo.')
      setError(e.message)
      if (e.code === 'ITEM_UNAVAILABLE' || e.code === 'ITEM_NOT_FOUND') {
        void queryClient.invalidateQueries({ queryKey: qk.menu(table.restaurant.id) })
      }
    },
  })

  return (
    <Sheet
      open={open}
      onClose={onClose}
      icon={<ShoppingBag size={20} className="text-brand-600" aria-hidden="true" />}
      title="Tu pedido"
      subtitle={`Mesa ${table.table.label ?? table.table.number} · ${count} ${plural(count, 'ítem', 'ítems')}`}
      footer={
        cart.lines.length > 0 && (
          <>
            {error && (
              <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            )}
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-stone-500">Total estimado</span>
              <span className="text-2xl font-bold">{formatPrice(cartTotal(cart), currency)}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="lg" onClick={() => dispatch({ type: 'CLEAR' })} disabled={submit.isPending}>
                Vaciar
              </Button>
              <Button
                size="lg"
                icon={<Send size={18} />}
                onClick={() => submit.mutate()}
                disabled={submit.isPending}
                className="flex-1 shadow-lg shadow-brand-500/30"
              >
                {submit.isPending ? 'Enviando…' : 'Confirmar y Enviar Pedido'}
              </Button>
            </div>
          </>
        )
      }
    >
      {cart.lines.length === 0 ? (
        <div className="py-12 text-center">
          <ShoppingBag size={40} className="mx-auto mb-3 text-stone-300" aria-hidden="true" />
          <p className="font-semibold text-stone-700">Tu carrito está vacío</p>
          <p className="mt-1 text-sm text-stone-500">Agregá platos desde el menú.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {cart.lines.map((l) => (
            <li key={l.key} className="rounded-2xl bg-stone-50 p-3 ring-1 ring-stone-200/70">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-tight">{l.name}</p>
                  {l.optionLabels.length > 0 && (
                    <p className="mt-0.5 text-xs text-stone-600">{l.optionLabels.join(' · ')}</p>
                  )}
                  <p className="text-xs text-stone-500">{formatPrice(l.unitPrice, currency)} c/u</p>
                </div>
                <p className="font-bold">{formatPrice(l.unitPrice * l.qty, currency)}</p>
              </div>

              <div className="mt-2 flex items-center justify-between gap-3">
                <QtyControl qty={l.qty} onChange={(q) => dispatch({ type: 'SET_QTY', key: l.key, qty: q })} />
                <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => dispatch({ type: 'SET_QTY', key: l.key, qty: 0 })}>
                  Quitar
                </Button>
              </div>

              <label className="mt-2 block">
                <span className="sr-only">Notas para {l.name}</span>
                <input
                  type="text"
                  value={l.notes}
                  maxLength={200}
                  onChange={(e) => dispatch({ type: 'SET_NOTES', key: l.key, notes: e.target.value })}
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
