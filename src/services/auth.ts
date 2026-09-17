import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

export function onAuthStateChange(cb: (session: Session | null) => void): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => cb(session))
  return () => subscription.unsubscribe()
}

export async function signInWithPassword(email: string, password: string): Promise<Session> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  if (!data.session) throw new Error('No se pudo iniciar sesión.')
  return data.session
}

export interface SignUpResult {
  /** con la sesión ya armada (confirmación de email desactivada) o null (falta confirmar el correo) */
  session: Session | null
}

export async function signUpWithPassword(email: string, password: string, emailRedirectTo?: string): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({ email, password, options: emailRedirectTo ? { emailRedirectTo } : undefined })
  if (error) throw error
  return { session: data.session }
}

export async function resendSignupEmail(email: string): Promise<void> {
  const { error } = await supabase.auth.resend({ type: 'signup', email })
  if (error) throw error
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export interface JoinRestaurantResult {
  restaurantId: string
  role: string
}

/** Canjea un código de invitación: el usuario autenticado pasa a ser staff de ese restaurante. */
export async function joinRestaurant(code: string, displayName?: string): Promise<JoinRestaurantResult> {
  const { data, error } = await supabase.rpc('join_restaurant', { p_code: code, p_display_name: displayName ?? undefined })
  if (error) throw error
  const d = data as unknown as { restaurant_id: string; role: string }
  return { restaurantId: d.restaurant_id, role: d.role }
}

export interface CreateRestaurantResult {
  restaurantId: string
  slug: string
}

/** Alta SaaS: el usuario autenticado crea su restaurante y queda como owner. */
export async function createRestaurant(name: string, slug: string): Promise<CreateRestaurantResult> {
  const { data, error } = await supabase.rpc('create_restaurant', { p_name: name, p_slug: slug })
  if (error) throw error
  const d = data as unknown as { restaurant_id: string; slug: string }
  return { restaurantId: d.restaurant_id, slug: d.slug }
}
