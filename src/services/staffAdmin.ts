import { supabase } from '@/lib/supabase'
import type { Staff, StaffInvite, StaffRole, WaiterAssignment } from '@/types/domain'

// ── Personal ────────────────────────────────────────────────────────────
interface StaffRow {
  id: string
  restaurant_id: string
  role: StaffRole
  display_name: string
  is_active: boolean
}

export async function fetchStaffList(restaurantId: string): Promise<Staff[]> {
  const { data, error } = await supabase
    .from('staff')
    .select('id, restaurant_id, role, display_name, is_active')
    .eq('restaurant_id', restaurantId)
    .order('display_name')
  if (error) throw error
  return (data as StaffRow[]).map((s) => ({ id: s.id, restaurantId: s.restaurant_id, role: s.role, displayName: s.display_name, isActive: s.is_active }))
}

/** owner nunca se asigna desde acá: se define una sola vez al crear el restaurante. */
export async function updateStaffRole(id: string, role: Exclude<StaffRole, 'owner'>): Promise<void> {
  const { error } = await supabase.from('staff').update({ role }).eq('id', id)
  if (error) throw error
}

export async function setStaffActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from('staff').update({ is_active: isActive }).eq('id', id)
  if (error) throw error
}

// ── Invitaciones ────────────────────────────────────────────────────────
interface InviteRow {
  id: string
  email: string | null
  role: StaffRole
  code: string
  used_at: string | null
  expires_at: string
  created_at: string
}

export async function fetchInvites(restaurantId: string): Promise<StaffInvite[]> {
  const { data, error } = await supabase
    .from('staff_invites')
    .select('id, email, role, code, used_at, expires_at, created_at')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as InviteRow[]).map((i) => ({
    id: i.id,
    email: i.email,
    role: i.role,
    code: i.code,
    usedAt: i.used_at,
    expiresAt: i.expires_at,
    createdAt: i.created_at,
  }))
}

export interface CreateInviteInput {
  role: Exclude<StaffRole, 'owner'>
  email?: string | null
}

/** Crea una invitación y devuelve el código (la base lo genera solo, random_code(8)). */
export async function createInvite(restaurantId: string, input: CreateInviteInput): Promise<StaffInvite> {
  const { data, error } = await supabase
    .from('staff_invites')
    .insert({ restaurant_id: restaurantId, role: input.role, email: input.email || null })
    .select('id, email, role, code, used_at, expires_at, created_at')
    .single()
  if (error) throw error
  const i = data as InviteRow
  return { id: i.id, email: i.email, role: i.role, code: i.code, usedAt: i.used_at, expiresAt: i.expires_at, createdAt: i.created_at }
}

export async function deleteInvite(id: string): Promise<void> {
  const { error } = await supabase.from('staff_invites').delete().eq('id', id)
  if (error) throw error
}

// ── Asignaciones (todas las del restaurante, para el editor de admin) ────
interface AssignmentRow {
  id: string
  staff_id: string
  sector_id: string | null
  table_id: string | null
}

export async function fetchAllAssignments(restaurantId: string): Promise<WaiterAssignment[]> {
  const { data, error } = await supabase.from('waiter_assignments').select('id, staff_id, sector_id, table_id').eq('restaurant_id', restaurantId)
  if (error) throw error
  return (data as AssignmentRow[]).map((a) => ({ id: a.id, staffId: a.staff_id, sectorId: a.sector_id, tableId: a.table_id }))
}

/** Reemplaza toda la asignación de un mozo por la selección actual de sectores/mesas. */
export async function replaceAssignments(restaurantId: string, staffId: string, sectorIds: string[], tableIds: string[]): Promise<void> {
  const del = await supabase.from('waiter_assignments').delete().eq('staff_id', staffId)
  if (del.error) throw del.error
  const rows = [
    ...sectorIds.map((sectorId) => ({ restaurant_id: restaurantId, staff_id: staffId, sector_id: sectorId, table_id: null })),
    ...tableIds.map((tableId) => ({ restaurant_id: restaurantId, staff_id: staffId, sector_id: null, table_id: tableId })),
  ]
  if (rows.length === 0) return
  const ins = await supabase.from('waiter_assignments').insert(rows)
  if (ins.error) throw ins.error
}
