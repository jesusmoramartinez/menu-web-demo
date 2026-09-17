import { Check, Plus, SlidersHorizontal } from 'lucide-react'
import { formatPrice } from '@/lib/format'
import type { MenuItem } from '@/types/domain'
import { hasOptions } from './optionRules'

const TAG_STYLES: Record<string, string> = {
  Popular: 'bg-amber-100 text-amber-800',
  Vegetariano: 'bg-emerald-100 text-emerald-800',
  Picante: 'bg-red-100 text-red-800',
  Chef: 'bg-violet-100 text-violet-800',
  'Sin alcohol': 'bg-sky-100 text-sky-800',
}

interface MenuItemCardProps {
  item: MenuItem
  currency: string
  /** unidades de este plato ya en el carrito (sumando variantes) */
  inCart: number
  onAdd: (item: MenuItem) => void
}

export function MenuItemCard({ item, currency, inCart, onAdd }: MenuItemCardProps) {
  const configurable = hasOptions(item)

  return (
    <article
      className={`flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-stone-200/70 transition hover:shadow-md ${item.soldOut ? 'opacity-60' : ''}`}
      aria-label={`${item.name}${item.soldOut ? ', agotado hoy' : ''}`}
    >
      <div className="relative h-24 w-24 shrink-0 sm:h-28 sm:w-28">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" loading="lazy" className="h-full w-full rounded-xl bg-stone-100 object-cover" />
        ) : (
          <div className="h-full w-full rounded-xl bg-stone-100" />
        )}
        {item.soldOut && (
          <span className="absolute inset-x-1 bottom-1 rounded-md bg-stone-900/85 px-1 py-0.5 text-center text-[10px] font-bold text-white">
            Agotado hoy
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.map((t) => (
              <span key={t} className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${TAG_STYLES[t] ?? 'bg-stone-100 text-stone-700'}`}>
                {t}
              </span>
            ))}
          </div>
        )}
        <h3 className="mt-1 font-semibold leading-tight text-stone-900">{item.name}</h3>
        {item.description && <p className="mt-0.5 line-clamp-2 text-xs text-stone-500">{item.description}</p>}

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-base font-bold text-stone-900">
            {configurable && <span className="text-xs font-normal text-stone-500">desde </span>}
            {formatPrice(item.price, currency)}
          </span>
          <button
            type="button"
            onClick={() => onAdd(item)}
            disabled={item.soldOut}
            aria-label={
              item.soldOut
                ? `${item.name} agotado`
                : configurable
                  ? `Elegir opciones de ${item.name}`
                  : inCart
                    ? `Agregar otro ${item.name} (${inCart} en carrito)`
                    : `Agregar ${item.name}`
            }
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold shadow-sm transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50
              ${inCart ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-brand-500 text-white hover:bg-brand-600'}`}
          >
            {inCart ? <Check size={16} aria-hidden="true" /> : configurable ? <SlidersHorizontal size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
            {item.soldOut ? 'Agotado' : inCart ? `${inCart} en carrito` : configurable ? 'Elegir' : 'Agregar'}
          </button>
        </div>
      </div>
    </article>
  )
}
