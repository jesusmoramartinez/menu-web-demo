import { supabase } from '@/lib/supabase'
import { uid } from '@/lib/uid'

const BUCKET = 'restaurant-media'
const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

export class MediaUploadError extends Error {}

const extensionOf = (file: File) => file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'

/**
 * Sube una imagen a `restaurant-media/<restaurantId>/<folder>/<archivo>` y devuelve su URL pública.
 * `folder` es 'logo' o 'menu' — sólo organiza la carpeta, la política de RLS mira el primer segmento (restaurantId).
 */
export async function uploadRestaurantMedia(restaurantId: string, folder: 'logo' | 'menu', file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new MediaUploadError('Formato no admitido. Usá PNG, JPG, WEBP o GIF.')
  }
  if (file.size > MAX_BYTES) {
    throw new MediaUploadError('La imagen pesa más de 5 MB. Achicala e intentá de nuevo.')
  }
  const path = `${restaurantId}/${folder}/${uid('img')}.${extensionOf(file)}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw error
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}
