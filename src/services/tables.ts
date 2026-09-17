import { supabase } from '@/lib/supabase'
import type { OrderStatus, SessionStatus, TableContext, TableOverview } from '@/types/domain'
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

const ACTIVE_ORDER_STATUSES: OrderStatus[] = ['pending', 'kitchen', 'ready']

interface TableRow {
  id: string
  number: number
  label: string | null
  sector_id: string | null
  sectors: { name: string } | null
}
interface SessionRow {
  id: string
  table_id: string
  status: SessionStatus
  opened_at: string
}
interface OrderTotalRow {
  session_id: string
  status: OrderStatus
  total: number
}

/**
 * Panorama de mesas para la pestaña "Mesas" del mozo: todas las mesas del
 * restaurante con su sector, si tienen sesión abierta, el total acumulado y
 * si se pueden cerrar (sin pedidos pending/kitchen/ready).
 */
export async function fetchTablesOverview(restaurantId: string): Promise<TableOverview[]> {
  const [tablesRes, sessionsRes, ordersRes] = await Promise.all([
    supabase.from('tables').select('id, number, label, sector_id, sectors(name)').eq('restaurant_id', restaurantId).eq('is_active', true),
    supabase.from('table_sessions').select('id, table_id, status, opened_at').eq('restaurant_id', restaurantId).neq('status', 'closed'),
    supabase.from('orders').select('session_id, status, total').eq('restaurant_id', restaurantId).neq('status', 'cancelled'),
  ])
  if (tablesRes.error) throw tablesRes.error
  if (sessionsRes.error) throw sessionsRes.error
  if (ordersRes.error) throw ordersRes.error

  const sessionByTable = new Map<string, SessionRow>()
  for (const s of sessionsRes.data as SessionRow[]) sessionByTable.set(s.table_id, s)

  const totalsBySession = new Map<string, { total: number; hasActive: boolean }>()
  for (const o of ordersRes.data as OrderTotalRow[]) {
    const acc = totalsBySession.get(o.session_id) ?? { total: 0, hasActive: false }
    acc.total += o.total
    if (ACTIVE_ORDER_STATUSES.includes(o.status)) acc.hasActive = true
    totalsBySession.set(o.session_id, acc)
  }

  return (tablesRes.data as TableRow[])
    .map((t) => {
      const session = sessionByTable.get(t.id) ?? null
      const totals = session ? (totalsBySession.get(session.id) ?? { total: 0, hasActive: false }) : null
      return {
        id: t.id,
        number: t.number,
        label: t.label,
        sectorId: t.sector_id,
        sectorName: t.sectors?.name ?? null,
        sessionId: session?.id ?? null,
        sessionStatus: session?.status ?? null,
        openedAt: session?.opened_at ?? null,
        total: totals?.total ?? 0,
        canClose: session ? !totals?.hasActive : false,
      } satisfies TableOverview
    })
    .sort((a, b) => a.number - b.number)
}

export async function closeTableSession(sessionId: string): Promise<void> {
  const { error } = await supabase.rpc('close_table_session', { p_session_id: sessionId })
  if (error) throw error
}
