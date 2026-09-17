import { Save, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Modal'
import { useMenuAdminMutations } from '@/hooks/useAdminMutations'
import type { AdminCategory, AdminMenuItem } from '@/types/domain'
import { ImageUploadField } from './ImageUploadField'
import { OptionGroupEditor } from './OptionGroupEditor'

const inputCls =
  'w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'

interface ItemEditModalProps {
  restaurantId: string
  categories: AdminCategory[]
  /** null = plato nuevo */
  item: AdminMenuItem | null
  nextSortOrder: number
  onClose: () => void
}

/** Alta/edición de un plato: datos base + (una vez que tiene id) el editor de variantes. */
export function ItemEditModal({ restaurantId, categories, item, nextSortOrder, onClose }: ItemEditModalProps) {
  const m = useMenuAdminMutations(restaurantId)
  const [savedId, setSavedId] = useState<string | null>(item?.id ?? null)
  const [name, setName] = useState(item?.name ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? categories[0]?.id ?? '')
  const [price, setPrice] = useState(item ? (item.price / 100).toFixed(2) : '')
  const [imageUrl, setImageUrl] = useState<string | null>(item?.imageUrl ?? null)
  const [tagsText, setTagsText] = useState(item?.tags.join(', ') ?? '')

  const valid = name.trim().length > 0 && categoryId && Number(price) >= 0

  const handleSave = () => {
    if (!valid) return
    m.saveMenuItem.mutate(
      {
        id: savedId ?? undefined,
        categoryId,
        name: name.trim(),
        description: description.trim(),
        price: Math.round(Number(price) * 100),
        imageUrl,
        tags: tagsText
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        sortOrder: item?.sortOrder ?? nextSortOrder,
      },
      { onSuccess: (id) => setSavedId(id) },
    )
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={item ? 'Editar plato' : 'Nuevo plato'}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" size="lg" icon={<X size={18} />} onClick={onClose}>
            {savedId ? 'Listo' : 'Cancelar'}
          </Button>
          <Button size="lg" icon={<Save size={18} />} onClick={handleSave} disabled={!valid || m.saveMenuItem.isPending} className="flex-1">
            {m.saveMenuItem.isPending ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <label className="block">
          <span className="text-sm font-semibold">Nombre</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={`mt-1 ${inputCls}`} />
        </label>

        <label className="block">
          <span className="text-sm font-semibold">Descripción</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={`mt-1 ${inputCls} resize-none`} />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-semibold">Categoría</span>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={`mt-1 ${inputCls}`}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Precio</span>
            <input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className={`mt-1 ${inputCls}`} />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-semibold">Etiquetas (separadas por coma)</span>
          <input value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="Popular, Vegetariano…" className={`mt-1 ${inputCls}`} />
        </label>

        <ImageUploadField label="Foto" restaurantId={restaurantId} folder="menu" value={imageUrl} onChange={setImageUrl} />

        {savedId ? (
          <div className="border-t border-stone-200 pt-4">
            <OptionGroupEditor restaurantId={restaurantId} menuItemId={savedId} />
          </div>
        ) : (
          <p className="rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-500">Guardá el plato para poder agregarle variantes (tamaño, extras…).</p>
        )}
      </div>
    </Sheet>
  )
}
