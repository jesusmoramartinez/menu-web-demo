import { supabase } from '@/lib/supabase'

export const DEMO_SLUG = 'demo'
export const DEMO_TABLE_TOKEN = 'demo-mesa-04'
export const DEMO_CLIENT_PATH = `/demo/m/${DEMO_TABLE_TOKEN}`

/** Recrea el tenant demo desde cero (menú, mesas y actividad de muestra). */
export async function resetDemo(): Promise<void> {
  const { error } = await supabase.rpc('reset_demo')
  if (error) throw error
}
