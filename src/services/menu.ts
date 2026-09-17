import { supabase } from '@/lib/supabase'
import type { Category, Menu, MenuItem, OptionGroup, OptionSelection } from '@/types/domain'

/** Fecha de hoy en UTC (misma referencia que `current_date` en la base). */
const todayISO = () => new Date().toISOString().slice(0, 10)

const bySort = <T extends { sort_order: number }>(a: T, b: T) => a.sort_order - b.sort_order

interface OptionRow {
  id: string
  name: string
  price_delta: number
  is_available: boolean
  sort_order: number
}
interface GroupRow {
  id: string
  name: string
  selection: OptionSelection
  required: boolean
  min_select: number
  max_select: number | null
  sort_order: number
  options: OptionRow[]
}
interface ItemRow {
  id: string
  category_id: string
  name: string
  description: string
  price: number
  image_url: string | null
  tags: string[]
  sold_out_until: string | null
  sort_order: number
  option_groups: GroupRow[]
}

const toGroup = (g: GroupRow): OptionGroup => ({
  id: g.id,
  name: g.name,
  selection: g.selection,
  required: g.required,
  minSelect: g.min_select,
  maxSelect: g.max_select,
  options: [...g.options]
    .sort(bySort)
    .map((o) => ({ id: o.id, name: o.name, priceDelta: o.price_delta, isAvailable: o.is_available })),
})

const toItem = (i: ItemRow, today: string): MenuItem => ({
  id: i.id,
  categoryId: i.category_id,
  name: i.name,
  description: i.description,
  price: i.price,
  imageUrl: i.image_url,
  tags: i.tags ?? [],
  soldOut: i.sold_out_until !== null && i.sold_out_until >= today,
  optionGroups: [...i.option_groups].sort(bySort).map(toGroup),
})

/** Menú público de un restaurante: categorías activas y platos visibles con sus variantes. */
export async function fetchMenu(restaurantId: string): Promise<Menu> {
  const [cats, items] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, emoji, sort_order')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('menu_items')
      .select(
        'id, category_id, name, description, price, image_url, tags, sold_out_until, sort_order, ' +
          'option_groups(id, name, selection, required, min_select, max_select, sort_order, ' +
          'options(id, name, price_delta, is_available, sort_order))',
      )
      .eq('restaurant_id', restaurantId)
      .eq('is_available', true)
      .order('sort_order'),
  ])
  if (cats.error) throw cats.error
  if (items.error) throw items.error

  const today = todayISO()
  const categories: Category[] = cats.data.map((c) => ({ id: c.id, name: c.name, emoji: c.emoji, sortOrder: c.sort_order }))
  return { categories, items: (items.data as unknown as ItemRow[]).map((i) => toItem(i, today)) }
}
