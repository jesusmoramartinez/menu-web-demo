import type { MenuItem, OptionGroup } from '@/types/domain'

/** Selección por grupo: { [groupId]: optionIds[] } */
export type Selection = Record<string, string[]>

/** Mensaje de error para un grupo, o null si la selección es válida. */
export function validateGroup(group: OptionGroup, selected: string[]): string | null {
  const n = selected.length
  if (group.required && n < Math.max(group.minSelect, 1)) {
    return group.selection === 'single' ? 'Elegí una opción' : `Elegí al menos ${Math.max(group.minSelect, 1)}`
  }
  if (n < group.minSelect) return `Elegí al menos ${group.minSelect}`
  if (group.selection === 'single' && n > 1) return 'Sólo una opción'
  if (group.maxSelect !== null && n > group.maxSelect) return `Como máximo ${group.maxSelect}`
  return null
}

/** Errores por grupo (vacío si todo es válido). */
export function validateSelection(groups: OptionGroup[], selection: Selection): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const g of groups) {
    const err = validateGroup(g, selection[g.id] ?? [])
    if (err) errors[g.id] = err
  }
  return errors
}

/** Selección inicial: en grupos single obligatorios se preselecciona la primera opción disponible. */
export function defaultSelection(groups: OptionGroup[]): Selection {
  const sel: Selection = {}
  for (const g of groups) {
    const first = g.options.find((o) => o.isAvailable)
    sel[g.id] = g.required && g.selection === 'single' && first ? [first.id] : []
  }
  return sel
}

/** Alterna una opción respetando el tipo de grupo (single reemplaza, multiple agrega/quita). */
export function toggleOption(group: OptionGroup, current: string[], optionId: string): string[] {
  if (group.selection === 'single') return current[0] === optionId && !group.required ? [] : [optionId]
  return current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId]
}

export const flatOptionIds = (selection: Selection) => Object.values(selection).flat()

/** Precio unitario del plato con las opciones elegidas (nunca negativo). */
export function unitPrice(item: MenuItem, selection: Selection): number {
  const delta = item.optionGroups.reduce((sum, g) => {
    const chosen = selection[g.id] ?? []
    return sum + g.options.filter((o) => chosen.includes(o.id)).reduce((s, o) => s + o.priceDelta, 0)
  }, 0)
  return Math.max(0, item.price + delta)
}

/** Etiquetas legibles de lo elegido, en el orden de los grupos. */
export function selectedLabels(item: MenuItem, selection: Selection): string[] {
  return item.optionGroups.flatMap((g) => {
    const chosen = selection[g.id] ?? []
    return g.options.filter((o) => chosen.includes(o.id)).map((o) => o.name)
  })
}

export const hasOptions = (item: MenuItem) => item.optionGroups.some((g) => g.options.length > 0)
