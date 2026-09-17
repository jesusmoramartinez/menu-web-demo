import type { StaffRole } from '@/types/domain'

/** A qué pantalla mandar a cada rol después de iniciar sesión. */
export function roleHome(role: StaffRole): string {
  return role === 'kitchen' ? '/cocina' : '/mozo'
}
