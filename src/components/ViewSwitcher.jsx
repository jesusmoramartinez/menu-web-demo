import { ChefHat, RotateCcw, Smartphone, UserRound } from 'lucide-react'
import { useRestaurant } from '../context/RestaurantContext'

const VIEWS = [
  { id: 'client', label: 'Cliente', Icon: Smartphone },
  { id: 'waiter', label: 'Mozo', Icon: UserRound },
  { id: 'kitchen', label: 'Cocina', Icon: ChefHat },
]

/** Barra superior de la demo para alternar entre los tres roles. */
export default function ViewSwitcher() {
  const { view, setView, resetDemo, pendingOrders, alerts, kitchenOrders } = useRestaurant()

  const badges = {
    waiter: pendingOrders.length + alerts.length,
    kitchen: kitchenOrders.length,
  }

  return (
    <div className="sticky top-0 z-40 bg-stone-900 text-white shadow-md">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2">
        <span className="hidden text-xs font-semibold uppercase tracking-wider text-stone-400 sm:block">
          Demo
        </span>

        <div className="flex flex-1 gap-1 rounded-xl bg-stone-800 p-1">
          {VIEWS.map(({ id, label, Icon }) => {
            const active = view === id
            const badge = badges[id]
            return (
              <button
                key={id}
                onClick={() => setView(id)}
                className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium transition
                  ${active ? 'bg-brand-500 text-white shadow' : 'text-stone-300 hover:bg-stone-700'}`}
              >
                <Icon size={16} />
                <span>{label}</span>
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white ring-2 ring-stone-900">
                    {badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <button
          onClick={resetDemo}
          title="Reiniciar demo"
          className="rounded-lg p-2 text-stone-400 transition hover:bg-stone-800 hover:text-white"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  )
}
