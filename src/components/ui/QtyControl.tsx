import { Minus, Plus } from 'lucide-react'

interface QtyControlProps {
  qty: number
  onChange: (qty: number) => void
  size?: 'sm' | 'md'
  min?: number
}

export function QtyControl({ qty, onChange, size = 'md', min = 0 }: QtyControlProps) {
  const btn = `${size === 'sm' ? 'h-7 w-7' : 'h-9 w-9'} flex items-center justify-center rounded-full text-stone-700 transition hover:bg-stone-100 disabled:opacity-30`
  return (
    <div className="inline-flex items-center rounded-full bg-white ring-1 ring-stone-300">
      <button type="button" onClick={() => onChange(qty - 1)} disabled={qty <= min} className={btn} aria-label="Menos">
        <Minus size={14} />
      </button>
      <span className="min-w-8 text-center text-sm font-bold tabular-nums" aria-live="polite">
        {qty}
      </span>
      <button type="button" onClick={() => onChange(qty + 1)} className={btn} aria-label="Más">
        <Plus size={14} />
      </button>
    </div>
  )
}
