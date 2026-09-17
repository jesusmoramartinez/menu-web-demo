import { supabase } from '@/lib/supabase'
import type { Restaurant } from '@/types/domain'

export interface RestaurantRowLike {
  id: string
  slug: string
  name: string
  tagline: string | null
  logo_url: string | null
  currency: string
  locale: string
  theme: unknown
  is_demo: boolean
}

export function toRestaurant(r: RestaurantRowLike): Restaurant {
  const theme = (r.theme && typeof r.theme === 'object' ? r.theme : {}) as { brand?: string }
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    tagline: r.tagline,
    logoUrl: r.logo_url,
    currency: r.currency,
    locale: r.locale,
    theme,
    isDemo: r.is_demo,
  }
}

/** Restaurante por slug (lectura pública). Devuelve null si no existe. */
export async function fetchRestaurantBySlug(slug: string): Promise<Restaurant | null> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('id, slug, name, tagline, logo_url, currency, locale, theme, is_demo')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  return data ? toRestaurant(data) : null
}
