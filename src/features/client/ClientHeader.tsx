import { Bell, Pizza, Receipt } from 'lucide-react'
import { RESTAURANT } from '@/data/menu'
import { useRestaurant } from '@/hooks/useRestaurant'
import { useToast } from '@/hooks/useToast'

export function ClientHeader() {
  const { table, addAlert } = useRestaurant()
  const toast = useToast()

  const callWaiter = () => {
    addAlert(table, 'waiter')
    toast.show('Mozo en camino 🙋‍♂️', 'info')
  }
  const requestBill = () => {
    addAlert(table, 'bill')
    toast.show('Cuenta solicitada 🧾', 'info')
  }

  return (
    <header className="bg-gradient-to-br from-brand-600 to-brand-700 text-white">
      <div className="mx-auto max-w-3xl px-4 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30">
              <Pizza size={26} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">{RESTAURANT.name}</h1>
              <p className="text-xs text-brand-100">{RESTAURANT.tagline}</p>
            </div>
          </div>

          <div className="rounded-xl bg-white/15 px-3 py-1.5 text-right ring-1 ring-white/30">
            <p className="text-[10px] uppercase tracking-wider text-brand-100">Mesa</p>
            <p className="text-xl font-bold leading-none">{table}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={callWaiter}
            className="flex items-center justify-center gap-2 rounded-xl bg-white/15 px-3 py-2.5 text-sm font-semibold ring-1 ring-white/30 transition active:scale-95 hover:bg-white/25"
          >
            <Bell size={16} aria-hidden="true" /> Llamar al Mozo
          </button>
          <button
            type="button"
            onClick={requestBill}
            className="flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-brand-700 shadow transition active:scale-95 hover:bg-brand-50"
          >
            <Receipt size={16} aria-hidden="true" /> Pedir la Cuenta
          </button>
        </div>
      </div>
    </header>
  )
}
