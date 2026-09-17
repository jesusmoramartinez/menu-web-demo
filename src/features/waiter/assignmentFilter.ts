import type { WaiterAssignment } from '@/types/domain'

interface Locatable {
  tableId: string
  sectorId: string | null
}

/**
 * Filtra pedidos/alertas/mesas por la asignación del mozo (sectores ∪ mesas puntuales).
 * Sin asignaciones = ve todo (comportamiento por defecto, igual que hoy). `showAll` (toggle
 * "Ver todas") also lo pasa por alto.
 */
export function filterByAssignment<T extends Locatable>(items: T[], assignments: WaiterAssignment[], showAll: boolean): T[] {
  if (showAll || assignments.length === 0) return items
  const tableIds = new Set(assignments.map((a) => a.tableId).filter((id): id is string => id !== null))
  const sectorIds = new Set(assignments.map((a) => a.sectorId).filter((id): id is string => id !== null))
  return items.filter((i) => tableIds.has(i.tableId) || (i.sectorId !== null && sectorIds.has(i.sectorId)))
}

export const hasAssignments = (assignments: WaiterAssignment[]): boolean => assignments.length > 0
