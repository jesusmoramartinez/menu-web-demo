import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Modal'
import { QtyControl } from '@/components/ui/QtyControl'
import { formatPrice } from '@/lib/format'
import type { MenuItem, OptionGroup } from '@/types/domain'
import type { NewCartLine } from './cartReducer'
import {
  defaultSelection,
  flatOptionIds,
  selectedLabels,
  toggleOption,
  unitPrice,
  validateSelection,
  type Selection,
} from './optionRules'

interface ItemOptionsSheetProps {
  item: MenuItem
  currency: string
  onClose: () => void
  onAdd: (line: NewCartLine) => void
}

/** Hoja para elegir tamaño/extras, cantidad y notas antes de agregar al carrito. */
export function ItemOptionsSheet({ item, currency, onClose, onAdd }: ItemOptionsSheetProps) {
  const [selection, setSelection] = useState<Selection>(() => defaultSelection(item.optionGroups))
  const [qty, setQty] = useState(1)
  const [notes, setNotes] = useState('')
  const [touched, setTouched] = useState(false)

  const errors = validateSelection(item.optionGroups, selection)
  const price = unitPrice(item, selection)

  const toggle = (group: OptionGroup, optionId: string) =>
    setSelection((s) => ({ ...s, [group.id]: toggleOption(group, s[group.id] ?? [], optionId) }))

  const handleAdd = () => {
    setTouched(true)
    if (Object.keys(errors).length > 0) return
    onAdd({
      itemId: item.id,
      name: item.name,
      unitPrice: price,
      qty,
      notes: notes.trim(),
      optionIds: flatOptionIds(selection),
      optionLabels: selectedLabels(item, selection),
    })
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={item.name}
      subtitle={item.description || undefined}
      footer={
        <div className="flex items-center gap-3">
          <QtyControl qty={qty} onChange={setQty} min={1} />
          <Button size="lg" icon={<Plus size={18} />} onClick={handleAdd} className="flex-1">
            Agregar · {formatPrice(price * qty, currency)}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {item.optionGroups.map((g) => {
          const chosen = selection[g.id] ?? []
          const error = touched ? errors[g.id] : undefined
          const multiple = g.selection === 'multiple'
          return (
            <fieldset key={g.id}>
              <legend className="flex w-full items-baseline justify-between">
                <span className="font-semibold">{g.name}</span>
                <span className={`text-xs ${error ? 'font-semibold text-red-600' : 'text-stone-500'}`}>
                  {error ??
                    (g.required
                      ? 'Obligatorio'
                      : multiple
                        ? `Opcional${g.maxSelect ? ` · hasta ${g.maxSelect}` : ''}`
                        : 'Opcional')}
                </span>
              </legend>
              <div className="mt-2 space-y-1.5">
                {g.options.map((o) => {
                  const checked = chosen.includes(o.id)
                  return (
                    <label
                      key={o.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition
                        ${checked ? 'border-brand-500 bg-brand-50' : 'border-stone-200 bg-white hover:bg-stone-50'}
                        ${!o.isAvailable ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      <input
                        type={multiple ? 'checkbox' : 'radio'}
                        name={g.id}
                        checked={checked}
                        disabled={!o.isAvailable}
                        onChange={() => toggle(g, o.id)}
                        className="h-4 w-4 accent-brand-500"
                      />
                      <span className="flex-1">{o.name}</span>
                      <span className="text-stone-500 tabular-nums">
                        {o.priceDelta === 0
                          ? ''
                          : `${o.priceDelta > 0 ? '+' : '−'} ${formatPrice(Math.abs(o.priceDelta), currency)}`}
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>
          )
        })}

        <label className="block">
          <span className="text-sm font-semibold">Notas para la cocina</span>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={200}
            placeholder='"sin cebolla", "bien cocida"…'
            className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </label>
      </div>
    </Sheet>
  )
}
