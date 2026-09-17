import { SearchX, ShoppingBag } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { CATEGORIES, MENU_ITEMS, RESTAURANT } from '@/data/menu'
import { useRestaurant } from '@/hooks/useRestaurant'
import { formatPrice } from '@/lib/format'
import { CartDrawer } from './CartDrawer'
import { ClientHeader } from './ClientHeader'
import { MenuFilters, type CategoryFilter } from './MenuFilters'
import { MenuItemCard } from './MenuItemCard'

/** Minúsculas y sin acentos, para que "limon" encuentre "Limón". */
const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

export default function ClientView() {
  const { cartCount, cartTotal } = useRestaurant()
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [query, setQuery] = useState('')
  const [cartOpen, setCartOpen] = useState(false)

  const groups = useMemo(() => {
    const q = normalize(query.trim())
    const matches = MENU_ITEMS.filter((item) => {
      const matchesCat = category === 'all' || item.category === category
      const matchesQuery = !q || normalize(`${item.name} ${item.description} ${item.tags.join(' ')}`).includes(q)
      return matchesCat && matchesQuery
    })
    const cats = category === 'all' ? CATEGORIES : CATEGORIES.filter((c) => c.id === category)
    return cats
      .map((c) => ({ ...c, items: matches.filter((i) => i.category === c.id) }))
      .filter((g) => g.items.length > 0)
  }, [category, query])

  return (
    <div className="min-h-dvh pb-28">
      <ClientHeader />
      <MenuFilters category={category} onCategory={setCategory} query={query} onQuery={setQuery} />

      <main className="mx-auto max-w-3xl px-4 py-4">
        {groups.length === 0 ? (
          <EmptyState icon={SearchX} title="No encontramos platos" subtitle="Probá con otra búsqueda o categoría." />
        ) : (
          groups.map((g) => (
            <section key={g.id} className="mb-6" aria-labelledby={`cat-${g.id}`}>
              <h2 id={`cat-${g.id}`} className="mb-3 flex items-center gap-2 text-lg font-bold">
                <span aria-hidden="true">{g.emoji}</span> {g.label}
                <span className="text-sm font-normal text-stone-400">({g.items.length})</span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {g.items.map((item) => (
                  <MenuItemCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="mx-auto flex w-full max-w-3xl items-center justify-between rounded-2xl bg-stone-900 px-5 py-3.5 text-white shadow-2xl transition active:scale-[0.98] animate-slide-up"
          >
            <span className="flex items-center gap-3">
              <span className="relative">
                <ShoppingBag size={22} aria-hidden="true" />
                <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[11px] font-bold">
                  {cartCount}
                </span>
              </span>
              <span className="font-semibold">Ver pedido</span>
            </span>
            <span className="text-lg font-bold">{formatPrice(cartTotal, RESTAURANT.currency)}</span>
          </button>
        </div>
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  )
}
