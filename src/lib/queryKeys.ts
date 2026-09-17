/**
 * Claves de React Query. Todo lo del staff cuelga de ['staff', restaurantId]
 * para poder invalidarlo en bloque cuando llega un evento realtime.
 */
export const qk = {
  restaurantBySlug: (slug: string) => ['restaurant-by-slug', slug] as const,
  tableByToken: (token: string) => ['table', token] as const,
  menu: (restaurantId: string) => ['menu', restaurantId] as const,
  session: (sessionId: string) => ['session', sessionId] as const,
  staff: (restaurantId: string) => ['staff', restaurantId] as const,
  activeOrders: (restaurantId: string) => ['staff', restaurantId, 'orders'] as const,
  openAlerts: (restaurantId: string) => ['staff', restaurantId, 'alerts'] as const,
  tablesOverview: (restaurantId: string) => ['staff', restaurantId, 'tables'] as const,
  myStaff: (userId: string) => ['my-staff', userId] as const,
  myAssignments: (staffId: string) => ['my-assignments', staffId] as const,
}
