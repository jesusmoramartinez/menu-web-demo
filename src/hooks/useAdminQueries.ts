import { useQuery } from '@tanstack/react-query'
import { qk } from '@/lib/queryKeys'
import { fetchAdminCategories, fetchAdminMenuItems } from '@/services/menuAdmin'
import { fetchAllAssignments, fetchInvites, fetchStaffList } from '@/services/staffAdmin'
import { fetchAdminTables, fetchSectors } from '@/services/tablesAdmin'

export function useAdminCategories(restaurantId: string) {
  return useQuery({ queryKey: qk.adminCategories(restaurantId), queryFn: () => fetchAdminCategories(restaurantId) })
}

export function useAdminMenuItems(restaurantId: string) {
  return useQuery({ queryKey: qk.adminItems(restaurantId), queryFn: () => fetchAdminMenuItems(restaurantId) })
}

export function useSectors(restaurantId: string) {
  return useQuery({ queryKey: qk.sectors(restaurantId), queryFn: () => fetchSectors(restaurantId) })
}

export function useAdminTables(restaurantId: string) {
  return useQuery({ queryKey: qk.adminTables(restaurantId), queryFn: () => fetchAdminTables(restaurantId) })
}

export function useStaffList(restaurantId: string) {
  return useQuery({ queryKey: qk.staffList(restaurantId), queryFn: () => fetchStaffList(restaurantId) })
}

export function useInvites(restaurantId: string) {
  return useQuery({ queryKey: qk.invites(restaurantId), queryFn: () => fetchInvites(restaurantId) })
}

export function useAllAssignments(restaurantId: string) {
  return useQuery({ queryKey: qk.allAssignments(restaurantId), queryFn: () => fetchAllAssignments(restaurantId) })
}
