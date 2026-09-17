import { supabase } from '@/lib/supabase'
import type { Restaurant, Staff, WaiterAssignment } from '@/types/domain'
import { toRestaurant, type RestaurantRowLike } from './restaurants'

export interface MyStaff {
  staff: Staff
  restaurant: Restaurant
}

interface MyStaffRow {
  id: string
  restaurant_id: string
  role: Staff['role']
  display_name: string
  is_active: boolean
  restaurants: RestaurantRowLike | null
}

/**
 * Fila de staff del usuario autenticado, con su restaurante embebido.
 * `null` si el usuario todavía no se asoció a ningún restaurante (registro incompleto).
 */
export async function fetchMyStaff(userId: string): Promise<MyStaff | null> {
  const { data, error } = await supabase
    .from('staff')
    .select('id, restaurant_id, role, display_name, is_active, restaurants(*)')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  if (!data || !data.restaurants) return null
  const row = data as unknown as MyStaffRow
  return {
    staff: { id: row.id, restaurantId: row.restaurant_id, role: row.role, displayName: row.display_name, isActive: row.is_active },
    restaurant: toRestaurant(row.restaurants as RestaurantRowLike),
  }
}

interface AssignmentRow {
  id: string
  staff_id: string
  sector_id: string | null
  table_id: string | null
}

/** Sectores y/o mesas asignadas a un mozo. Vacío = sin restricción (ve todas las mesas). */
export async function fetchMyAssignments(staffId: string): Promise<WaiterAssignment[]> {
  const { data, error } = await supabase.from('waiter_assignments').select('id, staff_id, sector_id, table_id').eq('staff_id', staffId)
  if (error) throw error
  return (data as AssignmentRow[]).map((a) => ({ id: a.id, staffId: a.staff_id, sectorId: a.sector_id, tableId: a.table_id }))
}
