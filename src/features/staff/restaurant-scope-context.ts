import { createContext } from 'react'
import type { Restaurant } from '@/types/domain'

/** Restaurante sobre el que operan las vistas de mozo / cocina / admin. */
export interface RestaurantScope {
  restaurant: Restaurant
}

export const RestaurantScopeContext = createContext<RestaurantScope | null>(null)
