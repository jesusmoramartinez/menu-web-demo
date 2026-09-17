import { createContext } from 'react'
import type { Restaurant, StaffRole } from '@/types/domain'

/**
 * Restaurante sobre el que operan las vistas de mozo / cocina / admin.
 * `staffId`/`role` son null en la demo (nadie inicia sesión); en las rutas
 * reales (`StaffLayout`) vienen de la fila `staff` del usuario autenticado.
 */
export interface RestaurantScope {
  restaurant: Restaurant
  staffId: string | null
  role: StaffRole | null
}

export const RestaurantScopeContext = createContext<RestaurantScope | null>(null)
