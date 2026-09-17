import { useContext } from 'react'
import { RestaurantContext, type RestaurantContextValue } from '@/store/restaurant-context'

export function useRestaurant(): RestaurantContextValue {
  const ctx = useContext(RestaurantContext)
  if (!ctx) throw new Error('useRestaurant debe usarse dentro de <RestaurantProvider>')
  return ctx
}
