import { supabase } from '@/lib/supabase'

export type RealtimeTable = 'orders' | 'order_items' | 'alerts' | 'table_sessions' | 'menu_items'

const TABLES: RealtimeTable[] = ['orders', 'order_items', 'alerts', 'table_sessions', 'menu_items']

/**
 * Suscribe a los cambios de un restaurante (filtrados por restaurant_id y por RLS).
 * Devuelve la función para cancelar la suscripción.
 */
export function subscribeToRestaurant(restaurantId: string, onChange: (table: RealtimeTable) => void): () => void {
  let channel = supabase.channel(`restaurant:${restaurantId}`)
  for (const table of TABLES) {
    channel = channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table, filter: `restaurant_id=eq.${restaurantId}` },
      () => onChange(table),
    )
  }
  channel.subscribe()
  return () => {
    void supabase.removeChannel(channel)
  }
}
