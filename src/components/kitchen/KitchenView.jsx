import { ChefHat, CheckCircle2, Flame } from 'lucide-react'
import { useRestaurant } from '../../context/RestaurantContext'
import { useNow } from '../../utils/useNow'
import EmptyState from '../EmptyState'
import KitchenTicket from './KitchenTicket'

export default function KitchenView() {
  const { kitchenOrders, doneOrders } = useRestaurant()
  const now = useNow(5_000) // la cocina necesita el reloj más preciso

  const plates = kitchenOrders.reduce((s, o) => s + o.items.reduce((a, i) => a + i.qty, 0), 0)

  return (
    <div className="min-h-dvh bg-stone-200">
      <header className="bg-stone-900 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500">
              <ChefHat size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold whitespace-nowrap">Pantalla de Cocina</h1>
              <p className="text-xs text-stone-400">KDS · Don Remolo</p>
            </div>
          </div>
          <div className="flex gap-5 text-right">
            <Stat icon={Flame} value={kitchenOrders.length} label="comandas" />
            <Stat value={plates} label="platos" />
            <Stat icon={CheckCircle2} value={doneOrders.length} label="listas" muted />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-5">
        <div className="mb-4 flex items-center gap-4 text-xs font-medium text-stone-600">
          <Legend color="bg-emerald-600" label="< 8 min" />
          <Legend color="bg-amber-500" label="8 – 15 min" />
          <Legend color="bg-red-500" label="> 15 min" />
        </div>

        {kitchenOrders.length === 0 ? (
          <EmptyState
            icon={ChefHat}
            title="Sin comandas en cocina"
            subtitle="Cuando el mozo apruebe un pedido, aparecerá aquí."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {kitchenOrders.map((o, idx) => (
              <KitchenTicket key={o.id} order={o} now={now} index={idx} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function Stat({ icon: Icon, value, label, muted }) {
  return (
    <div className={muted ? 'text-stone-400' : ''}>
      <p className="flex items-center justify-end gap-1 text-2xl font-extrabold leading-none tabular-nums">
        {Icon && <Icon size={18} />} {value}
      </p>
      <p className="text-[11px] uppercase tracking-wider text-stone-400">{label}</p>
    </div>
  )
}

function Legend({ color, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded-full ${color}`} /> {label}
    </span>
  )
}
