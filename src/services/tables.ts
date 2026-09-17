import { supabase } from '@/lib/supabase'
import type { SessionStatus, TableContext } from '@/types/domain'
import { toRestaurant, type RestaurantRowLike } from './restaurants'

interface TableByTokenPayload {
  restaurant: RestaurantRowLike
  table: { id: string; number: number; label: string | null; sector: string | null }
  session: { id: string; status: SessionStatus; opened_at: string } | null
}

/** Contexto de la mesa a partir del token del QR. Devuelve null si el token no existe. */
export async function fetchTableByToken(token: string): Promise<TableContext | null> {
  const { data, error } = await supabase.rpc('get_table_by_token', { p_token: token })
  if (error) throw error
  if (!data) return null
  const p = data as unknown as TableByTokenPayload
  return {
    restaurant: toRestaurant(p.restaurant),
    table: { id: p.table.id, number: p.table.number, label: p.table.label, sector: p.table.sector },
    session: p.session ? { id: p.session.id, status: p.session.status, openedAt: p.session.opened_at } : null,
  }
}
