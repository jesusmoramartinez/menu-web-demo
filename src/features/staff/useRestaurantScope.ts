import { useContext } from 'react'
import { RestaurantScopeContext, type RestaurantScope } from './restaurant-scope-context'

export function useRestaurantScope(): RestaurantScope {
  const ctx = useContext(RestaurantScopeContext)
  if (!ctx) throw new Error('useRestaurantScope debe usarse dentro de un layout de staff (DemoLayout / StaffLayout)')
  return ctx
}
