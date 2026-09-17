import type { Session } from '@supabase/supabase-js'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  demoMenu,
  demoRestaurant,
  demoTable,
  ownerRestaurant,
  sessionAfterOrder,
  staffAlerts,
  staffOrders,
  tablesOverview,
} from '@/test/fixtures'
import type { Staff } from '@/types/domain'

// ── Servicios mockeados: la app se prueba sin red ──────────────────────────
const placeOrder = vi.fn(async () => ({ orderId: 'o-new', sessionId: 's-1', total: 980000 }))
const updateOrderStatus = vi.fn(async () => {})
const resolveAlert = vi.fn(async () => {})
const createAlert = vi.fn(async () => ({ alertId: 'a-new', sessionId: 's-1', created: true }))
const closeTableSession = vi.fn(async () => {})
const signInWithPassword = vi.fn()
const signUpWithPassword = vi.fn()
const joinRestaurant = vi.fn()
const createRestaurant = vi.fn()
const signOut = vi.fn()

vi.mock('@/services/restaurants', () => ({ fetchRestaurantBySlug: vi.fn(async (slug: string) => (slug === 'demo' ? demoRestaurant : null)) }))
vi.mock('@/services/tables', () => ({
  fetchTableByToken: vi.fn(async (token: string) => (token === 'demo-mesa-04' ? demoTable : null)),
  fetchTablesOverview: vi.fn(async () => tablesOverview),
  closeTableSession: (...args: unknown[]) => closeTableSession(...(args as [])),
}))
vi.mock('@/services/menu', () => ({ fetchMenu: vi.fn(async () => demoMenu) }))
vi.mock('@/services/orders', () => ({
  placeOrder: (...args: unknown[]) => placeOrder(...(args as [])),
  fetchSessionState: vi.fn(async (id: string) => (id === 's-1' ? sessionAfterOrder : null)),
  fetchActiveOrders: vi.fn(async () => staffOrders),
  updateOrderStatus: (...args: unknown[]) => updateOrderStatus(...(args as [])),
  updateOrderItems: vi.fn(async () => {}),
}))
vi.mock('@/services/alerts', () => ({
  createAlert: (...args: unknown[]) => createAlert(...(args as [])),
  fetchOpenAlerts: vi.fn(async () => staffAlerts),
  resolveAlert: (...args: unknown[]) => resolveAlert(...(args as [])),
}))
vi.mock('@/services/realtime', () => ({ subscribeToRestaurant: vi.fn(() => () => {}) }))
vi.mock('@/services/demo', async () => ({
  DEMO_SLUG: 'demo',
  DEMO_TABLE_TOKEN: 'demo-mesa-04',
  DEMO_CLIENT_PATH: '/demo/m/demo-mesa-04',
  resetDemo: vi.fn(async () => {}),
}))

// ── Auth: la sesión "persistida" para cada test se setea con setMockSession() ──
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
  signInWithPassword: (...args: unknown[]) => signInWithPassword(...(args as [])),
  signUpWithPassword: (...args: unknown[]) => signUpWithPassword(...(args as [])),
  resendSignupEmail: vi.fn(async () => {}),
  signOut: (...args: unknown[]) => signOut(...(args as [])),
  joinRestaurant: (...args: unknown[]) => joinRestaurant(...(args as [])),
  createRestaurant: (...args: unknown[]) => createRestaurant(...(args as [])),
}))

const waiterStaff: Staff = { id: 'u-waiter', restaurantId: ownerRestaurant.id, role: 'waiter', displayName: 'Mozo Uno', isActive: true }
const kitchenStaff: Staff = { id: 'u-kitchen', restaurantId: ownerRestaurant.id, role: 'kitchen', displayName: 'Cocina Uno', isActive: true }
const fetchMyStaff = vi.fn(async (userId: string) => {
  if (userId === 'u-waiter') return { staff: waiterStaff, restaurant: ownerRestaurant }
  if (userId === 'u-kitchen') return { staff: kitchenStaff, restaurant: ownerRestaurant }
  return null
})
vi.mock('@/services/staff', () => ({
  fetchMyStaff: (...args: unknown[]) => fetchMyStaff(...(args as [string])),
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

describe('rutas', () => {
  it('/ muestra la landing con acceso a la demo', async () => {
    renderAt('/')
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(/tus mesas piden solas/i)
    expect(screen.getByRole('link', { name: /probar la demo/i })).toHaveAttribute('href', '/demo')
  })

  it('/demo redirige a la mesa demo y muestra el menú real', async () => {
    renderAt('/demo')
    expect(await screen.findByRole('heading', { level: 1, name: /don remolo/i })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: /pizzas/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /agotado/i })).toBeDisabled()
  })

  it('un token inexistente muestra "Mesa no encontrada"', async () => {
    renderAt('/r/demo/m/no-existe')
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(/mesa no encontrada/i)
  })

  it('una ruta inexistente muestra 404', async () => {
    renderAt('/no-existe')
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(/no encontrada/i)
  })
})

describe('comensal', () => {
  it('elige variantes, confirma el pedido y lo sigue en "Mis pedidos"', async () => {
    const user = userEvent.setup()
    renderAt('/demo/m/demo-mesa-04')

    // Plato sin opciones: agrega directo
    await user.click(await screen.findByRole('button', { name: /^agregar agua mineral/i }))
    expect(screen.getByRole('button', { name: /ver pedido/i })).toHaveTextContent('1')

    // Plato con opciones: abre la hoja, cambia el tamaño y agrega
    await user.click(screen.getByRole('button', { name: /elegir opciones de muzzarella/i }))
    const sheet = await screen.findByRole('dialog')
    await user.click(within(sheet).getByRole('radio', { name: /chica/i }))
    expect(within(sheet).getByRole('button', { name: /agregar · \$\s?6\.800/i })).toBeInTheDocument()
    await user.click(within(sheet).getByRole('button', { name: /agregar ·/i }))

    // Carrito: dos líneas, total estimado y confirmación
    await user.click(screen.getByRole('button', { name: /ver pedido/i }))
    const cart = await screen.findByRole('dialog')
    expect(within(cart).getByText('Chica')).toBeInTheDocument()
    await user.click(within(cart).getByRole('button', { name: /confirmar y enviar/i }))

    await waitFor(() => expect(placeOrder).toHaveBeenCalledTimes(1))
    expect(placeOrder).toHaveBeenCalledWith('demo-mesa-04', [
      { menu_item_id: 'i-agua', qty: 1, notes: '', option_ids: [] },
      { menu_item_id: 'i-muzza', qty: 1, notes: '', option_ids: ['opt-chica'] },
    ])

    // Salta a "Mis pedidos" con el estado del servidor
    expect(await screen.findByText(/recibido · el mozo lo está revisando/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /ver pedido/i })).not.toBeInTheDocument()
  })

  it('llamar al mozo crea la alerta y bloquea el botón', async () => {
    const user = userEvent.setup()
    renderAt('/demo/m/demo-mesa-04')
    await user.click(await screen.findByRole('button', { name: /llamar al mozo/i }))
    await waitFor(() => expect(createAlert).toHaveBeenCalledWith('demo-mesa-04', 'waiter'))
    expect(await screen.findByText(/mozo en camino/i)).toBeInTheDocument()
  })
})

describe('staff (demo, sin login)', () => {
  it('el mozo ve alertas y comandas, y envía a cocina', async () => {
    const user = userEvent.setup()
    renderAt('/demo/mozo')
    expect(await screen.findByRole('heading', { level: 1, name: /panel del mozo/i })).toBeInTheDocument()
    expect(await screen.findByText(/pide la cuenta/i)).toBeInTheDocument()
    const pending = await screen.findByRole('article', { name: /comanda mesa 11/i })
    expect(within(pending).getByText('Una sin aceitunas')).toBeInTheDocument()
    await user.click(within(pending).getByRole('button', { name: /a cocina/i }))
    await waitFor(() => expect(updateOrderStatus).toHaveBeenCalledWith('o-pending', 'kitchen'))
  })

  it('la pestaña Mesas muestra el panorama y cierra una mesa', async () => {
    const user = userEvent.setup()
    renderAt('/demo/mozo')
    await user.click(await screen.findByRole('tab', { name: /mesas/i }))
    expect(await screen.findByText('Mesa 5')).toBeInTheDocument()
    const closable = screen.getByText('Mesa 3').closest('article') as HTMLElement
    await user.click(within(closable).getByRole('button', { name: /cerrar mesa/i }))
    await waitFor(() => expect(closeTableSession).toHaveBeenCalledWith('sess-3'))
  })

  it('la cocina muestra los tickets en preparación con sus opciones', async () => {
    const user = userEvent.setup()
    renderAt('/demo/cocina')
    expect(await screen.findByRole('heading', { level: 1, name: /pantalla de cocina/i })).toBeInTheDocument()
    const ticket = await screen.findByRole('article', { name: /comanda mesa 2/i })
    expect(within(ticket).getByText('Grande')).toBeInTheDocument()
    expect(within(ticket).getByText(/sin ajo/i)).toBeInTheDocument()
    await user.click(within(ticket).getByRole('button', { name: /marcar como listo/i }))
    await waitFor(() => expect(updateOrderStatus).toHaveBeenCalledWith('o-kitchen', 'ready'))
  })
})

describe('login y guards de rol', () => {
  it('sin sesión, /mozo redirige a /login', async () => {
    renderAt('/mozo')
    expect(await screen.findByRole('heading', { level: 1, name: /ingresar/i })).toBeInTheDocument()
  })

  it('login exitoso lleva al mozo a /mozo', async () => {
    signInWithPassword.mockImplementation(async () => {
      const s = fakeSession('u-waiter')
      setMockSession(s)
      return s
    })
    const user = userEvent.setup()
    renderAt('/mozo')
    await screen.findByRole('heading', { name: /ingresar/i })
    await user.type(screen.getByLabelText(/email/i), 'mozo@ejemplo.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'secreta123')
    await user.click(screen.getByRole('button', { name: /^ingresar$/i }))
    expect(await screen.findByRole('heading', { level: 1, name: /panel del mozo/i })).toBeInTheDocument()
    expect(screen.getByText('Mozo Uno')).toBeInTheDocument()
  })

  it('login con credenciales inválidas muestra el error traducido', async () => {
    signInWithPassword.mockRejectedValue(new Error('Invalid login credentials'))
    const user = userEvent.setup()
    renderAt('/login')
    await user.type(screen.getByLabelText(/email/i), 'mozo@ejemplo.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'mala')
    await user.click(screen.getByRole('button', { name: /^ingresar$/i }))
    expect(await screen.findByText(/email o contraseña incorrectos/i)).toBeInTheDocument()
  })

  it('con sesión ya activa, entra directo (sin pedir login de nuevo)', async () => {
    setMockSession(fakeSession('u-kitchen'))
    renderAt('/cocina')
    expect(await screen.findByRole('heading', { level: 1, name: /pantalla de cocina/i })).toBeInTheDocument()
  })

  it('un mozo no puede entrar a /cocina (rol equivocado)', async () => {
    setMockSession(fakeSession('u-waiter'))
    renderAt('/cocina')
    expect(await screen.findByText(/no tenés permiso/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ir a tu pantalla/i })).toHaveAttribute('href', '/mozo')
  })

  it('sesión sin staff asociado muestra el aviso con link a /registro', async () => {
    setMockSession(fakeSession('u-huerfano'))
    renderAt('/mozo')
    expect(await screen.findByText(/todavía no está asociada/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /completar el alta/i })).toHaveAttribute('href', '/registro')
  })

  it('cerrar sesión vuelve a pedir login', async () => {
    signOut.mockImplementation(async () => setMockSession(null))
    setMockSession(fakeSession('u-waiter'))
    const user = userEvent.setup()
    renderAt('/mozo')
    await screen.findByRole('heading', { level: 1, name: /panel del mozo/i })
    await user.click(screen.getByRole('button', { name: /cerrar sesión/i }))
    expect(await screen.findByRole('heading', { level: 1, name: /ingresar/i })).toBeInTheDocument()
  })
})

describe('registro', () => {
  it('canjea un código de invitación y entra directo (sin confirmar email)', async () => {
    signUpWithPassword.mockImplementation(async () => {
      const s = fakeSession('u-waiter')
      setMockSession(s)
      return { session: s }
    })
    joinRestaurant.mockResolvedValue({ restaurantId: ownerRestaurant.id, role: 'waiter' })
    const user = userEvent.setup()
    renderAt('/registro')
    await user.type(await screen.findByLabelText(/código de invitación/i), '7k3pq9xz')
    await user.type(screen.getByLabelText(/tu nombre/i), 'Mozo Uno')
    await user.type(screen.getByLabelText(/^email$/i), 'mozo@ejemplo.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'secreta123')
    await user.click(screen.getByRole('button', { name: /unirme al equipo/i }))
    await waitFor(() => expect(joinRestaurant).toHaveBeenCalledWith('7K3PQ9XZ', 'Mozo Uno'))
    expect(await screen.findByRole('heading', { level: 1, name: /panel del mozo/i })).toBeInTheDocument()
  })

  it('si el proyecto exige confirmar el email, muestra "revisá tu correo"', async () => {
    signUpWithPassword.mockResolvedValue({ session: null })
    const user = userEvent.setup()
    renderAt('/registro')
    await user.type(await screen.findByLabelText(/código de invitación/i), 'ABCDEFGH')
    await user.type(screen.getByLabelText(/tu nombre/i), 'Mozo Dos')
    await user.type(screen.getByLabelText(/^email$/i), 'mozo2@ejemplo.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'secreta123')
    await user.click(screen.getByRole('button', { name: /unirme al equipo/i }))
    expect(await screen.findByRole('heading', { name: /revisá tu correo/i })).toBeInTheDocument()
    expect(screen.getByText('mozo2@ejemplo.com')).toBeInTheDocument()
    expect(joinRestaurant).not.toHaveBeenCalled()
  })

  it('crear restaurante nuevo da de alta al dueño', async () => {
    signUpWithPassword.mockImplementation(async () => {
      const s = fakeSession('u-owner-new')
      setMockSession(s)
      return { session: s }
    })
    createRestaurant.mockResolvedValue({ restaurantId: 'r-nuevo', slug: 'bar-de-ana' })
    fetchMyStaff.mockImplementation(async (userId: string) =>
      userId === 'u-owner-new'
        ? { staff: { id: 'u-owner-new', restaurantId: 'r-nuevo', role: 'owner' as const, displayName: 'Ana', isActive: true }, restaurant: ownerRestaurant }
        : null,
    )
    const user = userEvent.setup()
    renderAt('/registro')
    await user.click(await screen.findByRole('tab', { name: /crear mi restaurante/i }))
    await user.type(screen.getByLabelText(/nombre del restaurante/i), 'Bar de Ana')
    await user.type(screen.getByLabelText(/^email$/i), 'ana@ejemplo.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'secreta123')
    await user.click(screen.getByRole('button', { name: /crear restaurante/i }))
    await waitFor(() => expect(createRestaurant).toHaveBeenCalledWith('Bar de Ana', 'bar-de-ana'))
    expect(await screen.findByRole('heading', { level: 1, name: /panel del mozo/i })).toBeInTheDocument()
  })
})
