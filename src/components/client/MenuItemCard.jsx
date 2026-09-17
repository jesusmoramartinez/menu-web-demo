import { Check, Plus } from 'lucide-react'
import { useRestaurant } from '../../context/RestaurantContext'
import { formatPrice } from '../../utils/format'

const TAG_STYLES = {
  Popular: 'bg-amber-100 text-amber-800',
  Vegetariano: 'bg-emerald-100 text-emerald-800',
  Picante: 'bg-red-100 text-red-800',
  Chef: 'bg-violet-100 text-violet-800',
  'Sin alcohol': 'bg-sky-100 text-sky-800',
}

export default function MenuItemCard({ item }) {
  const { addToCart, cart } = useRestaurant()
  const inCart = cart.find((c) => c.itemId === item.id)

  return (
    <article className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-stone-200/70 transition hover:shadow-md">
      <img
        src={item.image}
        alt={item.name}
        loading="lazy"
        className="h-24 w-24 shrink-0 rounded-xl bg-stone-100 object-cover sm:h-28 sm:w-28"
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap gap-1">
          {item.tags.map((t) => (
            <span key={t} className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${TAG_STYLES[t] ?? 'bg-stone-100 text-stone-700'}`}>
              {t}
            </span>
          ))}
        </div>
        <h3 className="mt-1 font-semibold leading-tight text-stone-900">{item.name}</h3>
        <p className="mt-0.5 line-clamp-2 text-xs text-stone-500">{item.description}</p>

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-base font-bold text-stone-900">{formatPrice(item.price)}</span>
          <button
            onClick={() => addToCart(item)}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold shadow-sm transition active:scale-95
              ${inCart ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-brand-500 text-white hover:bg-brand-600'}`}
          >
            {inCart ? <Check size={16} /> : <Plus size={16} />}
            {inCart ? `${inCart.qty} en carrito` : 'Agregar'}
          </button>
        </div>
      </div>
    </article>
  )
}
