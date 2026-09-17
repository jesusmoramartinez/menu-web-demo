/**
 * Tipos de dominio de la UI (camelCase). Se construyen desde las filas de la
 * base (types/database.ts) en la capa services/. Importes SIEMPRE en centavos.
 */
import type { Database } from './database'

export type OrderStatus = Database['public']['Enums']['order_status']
export type AlertType = Database['public']['Enums']['alert_type']
export type SessionStatus = Database['public']['Enums']['session_status']
export type OptionSelection = Database['public']['Enums']['option_selection']
export type StaffRole = Database['public']['Enums']['staff_role']

export type ToastTone = 'success' | 'info' | 'error'

// ── Restaurante y mesa ─────────────────────────────────────────────────────
export interface Restaurant {
  id: string
  slug: string
  name: string
  tagline: string | null
  logoUrl: string | null
  currency: string
  locale: string
  /** color de marca (hex) y otras preferencias visuales */
  theme: { brand?: string }
  isDemo: boolean
}

export interface TableInfo {
  id: string
  number: number
  label: string | null
  sector: string | null
}

export interface SessionInfo {
  id: string
  status: SessionStatus
  openedAt: string
}

/** Resultado de get_table_by_token: todo lo que el comensal necesita para empezar. */
export interface TableContext {
  restaurant: Restaurant
  table: TableInfo
  session: SessionInfo | null
}

// ── Menú ───────────────────────────────────────────────────────────────────
export interface Category {
  id: string
  name: string
  emoji: string | null
  sortOrder: number
}

export interface MenuOption {
  id: string
  name: string
  priceDelta: number
  isAvailable: boolean
}

export interface OptionGroup {
  id: string
  name: string
  selection: OptionSelection
  required: boolean
  minSelect: number
  maxSelect: number | null
  options: MenuOption[]
}

export interface MenuItem {
  id: string
  categoryId: string
  name: string
  description: string
  price: number
  imageUrl: string | null
  tags: string[]
  /** agotado hoy (sold_out_until >= hoy) */
  soldOut: boolean
  optionGroups: OptionGroup[]
}

export interface Menu {
  categories: Category[]
  items: MenuItem[]
}

// ── Carrito (local al dispositivo del comensal) ────────────────────────────
export interface CartLine {
  /** itemId + opciones ordenadas: dos líneas con la misma clave se fusionan */
  key: string
  itemId: string
  name: string
  /** precio unitario con opciones (sólo para mostrar; el servidor recalcula) */
  unitPrice: number
  qty: number
  notes: string
  optionIds: string[]
  optionLabels: string[]
}

// ── Estado de la sesión del comensal (get_session_state) ───────────────────
export interface SelectedOption {
  groupName: string
  optionName: string
  priceDelta: number
}

export interface SessionOrderItem {
  id: string
  name: string
  qty: number
  unitPrice: number
  lineTotal: number
  notes: string
  selectedOptions: SelectedOption[]
}

export interface SessionOrder {
  id: string
  status: OrderStatus
  total: number
  createdAt: string
  sentToKitchenAt: string | null
  readyAt: string | null
  deliveredAt: string | null
  items: SessionOrderItem[]
}

export interface OpenAlert {
  id: string
  type: AlertType
  createdAt: string
}

export interface SessionState {
  session: { id: string; status: SessionStatus; openedAt: string; closedAt: string | null }
  table: { id: string; number: number; label: string | null }
  orders: SessionOrder[]
  openAlerts: OpenAlert[]
  total: number
}

// ── Vistas del staff (mozo / cocina) ───────────────────────────────────────
export interface StaffOrderItem {
  id: string
  menuItemId: string | null
  name: string
  unitPrice: number
  qty: number
  notes: string
  lineTotal: number
  selectedOptions: SelectedOption[]
}

export interface StaffOrder {
  id: string
  tableId: string
  tableNumber: number
  tableLabel: string | null
  /** null si la mesa no tiene sector asignado */
  sectorId: string | null
  sessionId: string
  status: OrderStatus
  total: number
  createdAt: string
  sentToKitchenAt: string | null
  readyAt: string | null
  deliveredAt: string | null
  items: StaffOrderItem[]
}

export interface StaffAlert {
  id: string
  tableId: string
  tableNumber: number
  tableLabel: string | null
  sectorId: string | null
  type: AlertType
  createdAt: string
}

// ── Personal (Fase 3: auth + roles) ─────────────────────────────────────────
export interface Staff {
  id: string
  restaurantId: string
  role: StaffRole
  displayName: string
  isActive: boolean
}

/** Asignación de un mozo a un sector completo o a una mesa puntual (nunca ambos). */
export interface WaiterAssignment {
  id: string
  staffId: string
  sectorId: string | null
  tableId: string | null
}

// ── Mesas (panel del mozo) ──────────────────────────────────────────────────
export interface TableOverview {
  id: string
  number: number
  label: string | null
  sectorId: string | null
  sectorName: string | null
  /** null = mesa libre, sin sesión abierta */
  sessionId: string | null
  sessionStatus: SessionStatus | null
  openedAt: string | null
  /** suma de pedidos no cancelados de la sesión abierta */
  total: number
  /** true si no hay pedidos pending/kitchen/ready en la sesión: se puede cerrar */
  canClose: boolean
}

// ── Administración (Fase 5) ─────────────────────────────────────────────────
export interface Sector {
  id: string
  name: string
  sortOrder: number
}

export interface AdminCategory {
  id: string
  name: string
  emoji: string | null
  sortOrder: number
  isActive: boolean
}

/** Grupo de opciones tal como lo edita el admin (mismo shape que OptionGroup, sin filtrar disponibilidad). */
export interface AdminMenuItem {
  id: string
  categoryId: string
  name: string
  description: string
  price: number
  imageUrl: string | null
  tags: string[]
  isAvailable: boolean
  /** fecha (YYYY-MM-DD) hasta la que está agotado, o null */
  soldOutUntil: string | null
  sortOrder: number
  optionGroups: OptionGroup[]
}

export interface AdminTable {
  id: string
  number: number
  label: string | null
  sectorId: string | null
  token: string
  isActive: boolean
}

export interface StaffInvite {
  id: string
  email: string | null
  role: StaffRole
  code: string
  usedAt: string | null
  expiresAt: string
  createdAt: string
}

