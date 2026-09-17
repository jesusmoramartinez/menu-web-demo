import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { demoMenu, demoRestaurant, demoTable, sessionAfterOrder, staffAlerts, staffOrders } from '@/test/fixtures'

// ── Servicios mockeados: la app se prueba sin red ──────────────────────────
const placeOrder = vi.fn(async () => ({ orderId: 'o-new', sessionId: 's-1', total: 980000 }))
const updateOrderStatus = vi.fn(async () => {})
const resolveAlert = vi.fn(async () => {})
const createAlert = vi.fn(async () => ({ alertId: 'a-new', sessionId: 's-1', created: true }))

vi.mock('@/services/restaurants', () => ({ fetchRestaurantBySlug: vi.fn(async (slug: string) => (slug === 'demo' ? demoRestaurant : null)) }))
vi.mock('@/services/tables', () => ({ fetchTableByToken: vi.fn(async (token: string) => (token === 'demo-mesa-04' ? demoTable : null)) }))
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

const { routes } = await import('./router')

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

beforeEach(() => {
  vi.clearAllMocks()
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

describe('staff (demo)', () => {
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
