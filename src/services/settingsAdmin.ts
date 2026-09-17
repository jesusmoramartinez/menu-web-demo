import { supabase } from '@/lib/supabase'
import type { Restaurant } from '@/types/domain'

export interface RestaurantSettingsInput {
  name: string
  tagline: string | null
  logoUrl: string | null
  currency: string
  brand: string | null
}

export async function updateRestaurantSettings(restaurantId: string, input: RestaurantSettingsInput): Promise<void> {
  const { error } = await supabase
    .from('restaurants')
    .update({
      name: input.name,
      tagline: input.tagline,
      logo_url: input.logoUrl,
      currency: input.currency,
      theme: input.brand ? { brand: input.brand } : {},
    })
    .eq('id', restaurantId)
  if (error) throw error
}

export const currentBrand = (restaurant: Restaurant): string => restaurant.theme.brand ?? '#f97316'
