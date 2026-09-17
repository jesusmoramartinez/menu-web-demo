import { Settings, Table2, UtensilsCrossed, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface AdminNavItem {
  to: string
  label: string
  icon: LucideIcon
}

export const ADMIN_NAV: AdminNavItem[] = [
  { to: 'menu', label: 'Menú', icon: UtensilsCrossed },
  { to: 'mesas', label: 'Mesas y sectores', icon: Table2 },
  { to: 'personal', label: 'Personal', icon: Users },
  { to: 'configuracion', label: 'Configuración', icon: Settings },
]
