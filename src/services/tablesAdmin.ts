import { supabase } from '@/lib/supabase'
import type { AdminTable, Sector } from '@/types/domain'

// ── Sectores ───────────────────────────────────────────────────────────────
interface SectorRow {
  id: string
  name: string
  sort_order: number
}

export async function fetchSectors(restaurantId: string): Promise<Sector[]> {
  const { data, error } = await supabase.from('sectors').select('id, name, sort_order').eq('restaurant_id', restaurantId).order('sort_order')
  if (error) throw error
  return (data as SectorRow[]).map((s) => ({ id: s.id, name: s.name, sortOrder: s.sort_order }))
}

export interface SectorInput {
  id?: string
  name: string
  sortOrder: number
}

export async function saveSector(restaurantId: string, input: SectorInput): Promise<void> {
  const row = { restaurant_id: restaurantId, name: input.name, sort_order: input.sortOrder }
  const { error } = input.id
    ? await supabase.from('sectors').update(row).eq('id', input.id)
    : await supabase.from('sectors').insert(row)
  if (error) throw error
}

/** Borra el sector; las mesas que lo tenían quedan sin sector (on delete set null), no se pierden. */
export async function deleteSector(id: string): Promise<void> {
  const { error } = await supabase.from('sectors').delete().eq('id', id)
  if (error) throw error
}

// ── Mesas ────────────────────────────────────────────────────────────────
interface TableRow {
  id: string
  number: number
  label: string | null
  sector_id: string | null
  token: string
  is_active: boolean
}

/** Todas las mesas (activas e inactivas) con su token de QR, para el admin. */
export async function fetchAdminTables(restaurantId: string): Promise<AdminTable[]> {
  const { data, error } = await supabase
    .from('tables')
    .select('id, number, label, sector_id, token, is_active')
    .eq('restaurant_id', restaurantId)
    .order('number')
  if (error) throw error
  return (data as TableRow[]).map((t) => ({ id: t.id, number: t.number, label: t.label, sectorId: t.sector_id, token: t.token, isActive: t.is_active }))
}

export interface TableInput {
  id?: string
  number: number
  label: string | null
  sectorId: string | null
}

/** Crea o actualiza una mesa. Devuelve la fila completa (necesitamos el token si es nueva). */
export async function saveTable(restaurantId: string, input: TableInput): Promise<AdminTable> {
  const row = { restaurant_id: restaurantId, number: input.number, label: input.label, sector_id: input.sectorId }
  const query = input.id
    ? supabase.from('tables').update(row).eq('id', input.id)
    : supabase.from('tables').insert(row)
  const { data, error } = await query.select('id, number, label, sector_id, token, is_active').single()
  if (error) throw error
  const t = data as TableRow
  return { id: t.id, number: t.number, label: t.label, sectorId: t.sector_id, token: t.token, isActive: t.is_active }
}

/**
 * "Eliminar" una mesa desactiva el token (deja de aceptar pedidos nuevos) en vez de
 * borrar la fila: borrarla arrastraría (cascade) todo su historial de pedidos.
 */
export async function setTableActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from('tables').update({ is_active: isActive }).eq('id', id)
  if (error) throw error
}
