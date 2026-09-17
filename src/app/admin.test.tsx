import type { Session } from '@supabase/supabase-js'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { demoRestaurant, ownerRestaurant } from '@/test/fixtures'
import type { AdminCategory, AdminMenuItem, AdminTable, Sector, Staff, StaffInvite } from '@/types/domain'

// ── Fixtures propios del admin ─────────────────────────────────────────────
const categories: AdminCategory[] = [
  { id: 'c-entradas', name: 'Entradas', emoji: '🥗', sortOrder: 0, isActive: true },
  { id: 'c-pizzas', name: 'Pizzas', emoji: '🍕', sortOrder: 1, isActive: true },
]
const items: AdminMenuItem[] = [
  {
    id: 'i-provoleta',
    categoryId: 'c-entradas',
    name: 'Provoleta',
    description: '',
    price: 650000,
    imageUrl: null,
    tags: [],
    isAvailable: true,
    soldOutUntil: null,
    sortOrder: 0,
    optionGroups: [],
  },
]
const sectors: Sector[] = [{ id: 's-salon', name: 'Salón', sortOrder: 0 }]
const tables: AdminTable[] = [{ id: 't-1', number: 1, label: null, sectorId: 's-salon', token: 'demo-mesa-01', isActive: true }]

// ── Servicios mockeados ─────────────────────────────────────────────────────
const updateItemPrice = vi.fn(async () => {})
const saveCategory = vi.fn(async () => {})
const saveSector = vi.fn(async () => {})
const createInvite = vi.fn(async () => ({ id: 'inv-1', email: null, role: 'waiter', code: 'ABC12345', usedAt: null, expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(), createdAt: new Date().toISOString() }) as StaffInvite)
const updateRestaurantSettings = vi.fn(async () => {})

vi.mock('@/services/restaurants', () => ({ fetchRestaurantBySlug: vi.fn(async (slug: string) => (slug === 'demo' ? demoRestaurant : null)) }))
vi.mock('@/services/tables', () => ({
  fetchTableByToken: vi.fn(async () => null),
  fetchTablesOverview: vi.fn(async () => []),
  closeTableSession: vi.fn(async () => {}),
}))
vi.mock('@/services/menu', () => ({ fetchMenu: vi.fn(async () => ({ categories: [], items: [] })) }))
vi.mock('@/services/orders', () => ({
  placeOrder: vi.fn(),
  fetchSessionState: vi.fn(async () => null),
  fetchActiveOrders: vi.fn(async () => []),
  updateOrderStatus: vi.fn(async () => {}),
  updateOrderItems: vi.fn(async () => {}),
}))
vi.mock('@/services/alerts', () => ({
  createAlert: vi.fn(),
  fetchOpenAlerts: vi.fn(async () => []),
  resolveAlert: vi.fn(async () => {}),
}))
vi.mock('@/services/realtime', () => ({ subscribeToRestaurant: vi.fn(() => () => {}) }))
vi.mock('@/services/demo', () => ({
  DEMO_SLUG: 'demo',
  DEMO_TABLE_TOKEN: 'demo-mesa-04',
  DEMO_CLIENT_PATH: '/demo/m/demo-mesa-04',
  resetDemo: vi.fn(async () => {}),
}))
vi.mock('@/services/media', () => ({ uploadRestaurantMedia: vi.fn(async () => 'https://example.com/img.png'), MediaUploadError: class extends Error {} }))

vi.mock('@/services/menuAdmin', () => ({
  fetchAdminCategories: vi.fn(async () => categories),
  fetchAdminMenuItems: vi.fn(async () => items),
  saveCategory: (...a: unknown[]) => saveCategory(...(a as [])),
  setCategoryActive: vi.fn(async () => {}),
  deleteCategory: vi.fn(async () => {}),
  saveMenuItem: vi.fn(async () => 'i-new'),
  deleteMenuItem: vi.fn(async () => {}),
  setItemAvailable: vi.fn(async () => {}),
  setSoldOutToday: vi.fn(async () => {}),
  updateItemPrice: (...a: unknown[]) => updateItemPrice(...(a as [])),
  saveOptionGroup: vi.fn(async () => 'g-new'),
  deleteOptionGroup: vi.fn(async () => {}),
  saveOption: vi.fn(async () => {}),
  deleteOption: vi.fn(async () => {}),
}))
vi.mock('@/services/tablesAdmin', () => ({
  fetchSectors: vi.fn(async () => sectors),
  saveSector: (...a: unknown[]) => saveSector(...(a as [])),
  deleteSector: vi.fn(async () => {}),
  fetchAdminTables: vi.fn(async () => tables),
  saveTable: vi.fn(async () => tables[0]),
  setTableActive: vi.fn(async () => {}),
}))
vi.mock('@/services/staffAdmin', () => ({
  fetchStaffList: vi.fn(async () => [] as Staff[]),
  updateStaffRole: vi.fn(async () => {}),
  setStaffActive: vi.fn(async () => {}),
  fetchInvites: vi.fn(async () => [] as StaffInvite[]),
  createInvite: (...a: unknown[]) => createInvite(...(a as [])),
  deleteInvite: vi.fn(async () => {}),
  fetchAllAssignments: vi.fn(async () => []),
  replaceAssignments: vi.fn(async () => {}),
}))
vi.mock('@/services/settingsAdmin', () => ({
  updateRestaurantSettings: (...a: unknown[]) => updateRestaurantSettings(...(a as [])),
  currentBrand: (r: { theme: { brand?: string } }) => r.theme.brand ?? '#f97316',
}))

// ── Auth (staff real, para probar el guard de /admin) ──────────────────────
let mockSession: Session | null = null
let authListener: ((s: Session | null) => void) | null = null
const fakeSession = (userId: string): Session => ({ user: { id: userId } }) as unknown as Session
function setMockSession(session: Session | null) {
  mockSession = session
  authListener?.(session)
}
vi.mock('@/services/auth', () => ({
  getSession: vi.fn(async () => mockSession),
  onAuthStateChange: vi.fn((cb: (s: Session | null) => void) => {
    authListener = cb
    return () => {
      authListener = null
    }
  }),
  signInWithPassword: vi.fn(),
  signUpWithPassword: vi.fn(),
  resendSignupEmail: vi.fn(async () => {}),
  signOut: vi.fn(async () => {}),
  joinRestaurant: vi.fn(),
  createRestaurant: vi.fn(),
}))
const waiterStaff: Staff = { id: 'u-waiter', restaurantId: ownerRestaurant.id, role: 'waiter', displayName: 'Mozo Uno', isActive: true }
vi.mock('@/services/staff', () => ({
  fetchMyStaff: vi.fn(async (userId: string) => (userId === 'u-waiter' ? { staff: waiterStaff, restaurant: ownerRestaurant } : null)),
  fetchMyAssignments: vi.fn(async () => []),
}))

const { routes } = await import('./router')

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

beforeEach(() => {
  vi.clearAllMocks()
  mockSession = null
  authListener = null
})

describe('guard de /admin', () => {
  it('un mozo no puede entrar (sólo owner/admin)', async () => {
    setMockSession(fakeSession('u-waiter'))
    renderAt('/admin')
    expect(await screen.findByText(/no tenés permiso/i)).toBeInTheDocument()
  })
})

describe('/demo/admin — Menú', () => {
  it('lista categorías y platos, y edita el precio', async () => {
    const user = userEvent.setup()
    renderAt('/demo/admin/menu')
    expect(await screen.findByRole('heading', { level: 2, name: /categorías/i })).toBeInTheDocument()
    const priceInput = await screen.findByLabelText(/precio de provoleta/i)
    await user.clear(priceInput)
    await user.type(priceInput, '70')
    await user.tab()
    await waitFor(() => expect(updateItemPrice).toHaveBeenCalledWith('i-provoleta', 7000))
  })

  it('crea una categoría nueva', async () => {
    const user = userEvent.setup()
    renderAt('/demo/admin/menu')
    const input = await screen.findByPlaceholderText(/nueva categoría/i)
    await user.type(input, 'Postres')
    await user.click(screen.getByRole('button', { name: /^agregar$/i }))
    await waitFor(() => expect(saveCategory).toHaveBeenCalledWith(demoRestaurant.id, { name: 'Postres', emoji: null, sortOrder: 2 }))
  })
})

describe('/demo/admin — Mesas y sectores', () => {
  it('lista sectores y mesas, y agrega un sector', async () => {
    const user = userEvent.setup()
    renderAt('/demo/admin/mesas')
    expect((await screen.findAllByText('Salón')).length).toBeGreaterThan(0)
    // "Mesa 1" aparece dos veces a propósito: la tarjeta editable y la hoja de impresión (oculta con CSS, no en jsdom)
    expect((await screen.findAllByText(/mesa 1/i)).length).toBeGreaterThan(0)
    await user.type(screen.getByPlaceholderText(/nuevo sector/i), 'Terraza')
    await user.click(screen.getByRole('button', { name: /^agregar$/i }))
    await waitFor(() => expect(saveSector).toHaveBeenCalledWith(demoRestaurant.id, { name: 'Terraza', sortOrder: 1 }))
  })
})

describe('/demo/admin — Personal', () => {
  it('genera un código de invitación', async () => {
    const user = userEvent.setup()
    renderAt('/demo/admin/personal')
    expect(await screen.findByText(/todavía no hay nadie más/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /generar código/i }))
    await waitFor(() => expect(createInvite).toHaveBeenCalledWith(demoRestaurant.id, { role: 'waiter', email: null }))
    expect(await screen.findByText('ABC12345')).toBeInTheDocument()
  })
})

describe('/demo/admin — Configuración', () => {
  it('guarda los cambios del restaurante', async () => {
    const user = userEvent.setup()
    renderAt('/demo/admin/configuracion')
    const nameInput = await screen.findByLabelText(/nombre del restaurante/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Nueva Pizzería')
    await user.click(screen.getByRole('button', { name: /guardar/i }))
    await waitFor(() => expect(updateRestaurantSettings).toHaveBeenCalledWith(demoRestaurant.id, expect.objectContaining({ name: 'Nueva Pizzería' })))
  })
})
