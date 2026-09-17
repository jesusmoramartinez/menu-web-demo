import { Search, X } from 'lucide-react'
import { CATEGORIES } from '../../data/menu'

export default function MenuFilters({ category, onCategory, query, onQuery }) {
  return (
    <div className="sticky top-[52px] z-30 border-b border-stone-200 bg-stone-100/95 backdrop-blur">
      <div className="mx-auto max-w-3xl px-4 py-3">
        {/* Buscador */}
        <label className="relative block">
          <Search size={18} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Buscar platos, ingredientes…"
            className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pr-9 pl-10 text-sm shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
          {query && (
            <button
              onClick={() => onQuery('')}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 text-stone-400 hover:bg-stone-100"
              aria-label="Limpiar búsqueda"
            >
              <X size={16} />
            </button>
          )}
        </label>

        {/* Categorías */}
        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
          <CategoryChip active={category === 'all'} onClick={() => onCategory('all')}>
            ✨ Todo
          </CategoryChip>
          {CATEGORIES.map((c) => (
            <CategoryChip key={c.id} active={category === c.id} onClick={() => onCategory(c.id)}>
              {c.emoji} {c.label}
            </CategoryChip>
          ))}
        </div>
      </div>
    </div>
  )
}

function CategoryChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition active:scale-95
        ${active ? 'bg-stone-900 text-white shadow' : 'bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50'}`}
    >
      {children}
    </button>
  )
}
