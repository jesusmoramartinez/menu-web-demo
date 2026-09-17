import { ChefHat, RotateCcw, Smartphone, UserRound, type LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router'
import { useRestaurant } from '@/hooks/useRestaurant'
import { useToast } from '@/hooks/useToast'

const VIEWS: { to: string; label: string; Icon: LucideIcon; badge: 'waiter' | 'kitchen' | null }[] = [
  { to: '/demo/cliente', label: 'Cliente', Icon: Smartphone, badge: null },
  { to: '/demo/mozo', label: 'Mozo', Icon: UserRound, badge: 'waiter' },
  { to: '/demo/cocina', label: 'Cocina', Icon: ChefHat, badge: 'kitchen' },
]

/** Barra superior de la DEMO para alternar entre los tres roles en un mismo navegador. */
export function DemoBar() {
  const { resetDemo, pendingOrders, alerts, kitchenOrders } = useRestaurant()
  const toast = useToast()

  const badges = {
    waiter: pendingOrders.length + alerts.length,
    kitchen: kitchenOrders.length,
  }

  const handleReset = () => {
    resetDemo()
    toast.show('Demo reiniciada', 'info')
  }

  return (
    <div className="sticky top-0 z-40 bg-stone-900 text-white shadow-md">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2">
        <span className="hidden text-xs font-semibold uppercase tracking-wider text-stone-400 sm:block">Demo</span>

        <nav className="flex flex-1 gap-1 rounded-xl bg-stone-800 p-1" aria-label="Vistas de la demo">
          {VIEWS.map(({ to, label, Icon, badge }) => {
            const count = badge ? badges[badge] : 0
            return (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium transition
                  ${isActive ? 'bg-brand-500 text-white shadow' : 'text-stone-300 hover:bg-stone-700'}`
                }
              >
                <Icon size={16} aria-hidden="true" />
                <span>{label}</span>
                {count > 0 && (
                  <span
                    className="absolute -top-1.5 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white ring-2 ring-stone-900"
                    aria-label={`${count} pendientes`}
                  >
                    {count}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        <button
          type="button"
          onClick={handleReset}
          title="Reiniciar demo"
          aria-label="Reiniciar demo"
          className="rounded-lg p-2 text-stone-400 transition hover:bg-stone-800 hover:text-white"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  )
}
