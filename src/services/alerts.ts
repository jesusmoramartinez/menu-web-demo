import { supabase } from '@/lib/supabase'
import type { AlertType, StaffAlert } from '@/types/domain'

export interface CreateAlertResult {
  alertId: string
  sessionId: string
  created: boolean
}

/** Llamar al mozo / pedir la cuenta desde la mesa (idempotente por tipo). */
export async function createAlert(token: string, type: AlertType): Promise<CreateAlertResult> {
  const { data, error } = await supabase.rpc('create_alert', { p_token: token, p_type: type })
  if (error) throw error
  const d = data as unknown as { alert_id: string; session_id: string; created: boolean }
  return { alertId: d.alert_id, sessionId: d.session_id, created: d.created }
}

interface AlertRow {
  id: string
  table_id: string
  type: AlertType
  created_at: string
  tables: { number: number; label: string | null } | null
}

/** Alertas sin resolver del restaurante, de la más vieja a la más nueva. */
export async function fetchOpenAlerts(restaurantId: string): Promise<StaffAlert[]> {
  const { data, error } = await supabase
    .from('alerts')
    .select('id, table_id, type, created_at, tables(number, label)')
    .eq('restaurant_id', restaurantId)
    .is('resolved_at', null)
    .order('created_at')
  if (error) throw error
  return (data as unknown as AlertRow[]).map((a) => ({
    id: a.id,
    tableId: a.table_id,
    tableNumber: a.tables?.number ?? 0,
    tableLabel: a.tables?.label ?? null,
    type: a.type,
    createdAt: a.created_at,
  }))
}

export async function resolveAlert(alertId: string): Promise<void> {
  const { data, error } = await supabase
    .from('alerts')
    .update({ resolved_at: new Date().toISOString() })
    .eq('id', alertId)
    .select('id')
  if (error) throw error
  if (!data?.length) throw new Error('No se pudo marcar la alerta (¿sin permisos?)')
}
