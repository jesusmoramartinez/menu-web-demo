import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { routes } from './router'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

describe('rutas', () => {
  it('/ muestra la landing con acceso a la demo', async () => {
    renderAt('/')
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(/tus mesas piden solas/i)
    expect(screen.getByRole('link', { name: /probar la demo/i })).toHaveAttribute('href', '/demo')
  })

  it('/demo redirige a la vista cliente', async () => {
    renderAt('/demo')
    expect(await screen.findByRole('heading', { level: 1, name: /don remolo/i })).toBeInTheDocument()
    expect(screen.getByText('Mesa')).toBeInTheDocument()
  })

  it('/demo/mozo muestra el panel del mozo con datos de prueba', async () => {
    renderAt('/demo/mozo')
    expect(await screen.findByRole('heading', { level: 1, name: /panel del mozo/i })).toBeInTheDocument()
    expect(screen.getByText(/pide la cuenta/i)).toBeInTheDocument()
  })

  it('/demo/cocina muestra la pantalla de cocina', async () => {
    renderAt('/demo/cocina')
    expect(await screen.findByRole('heading', { level: 1, name: /pantalla de cocina/i })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /marcar como listo/i }).length).toBeGreaterThan(0)
  })

  it('una ruta inexistente muestra 404', async () => {
    renderAt('/no-existe')
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(/no encontrada/i)
  })
})

describe('flujo cliente → mozo → cocina (store en memoria)', () => {
  it('agregar al carrito, confirmar y ver la comanda en mozo', async () => {
    const user = userEvent.setup()
    renderAt('/demo/cliente')

    const addButtons = await screen.findAllByRole('button', { name: /^agregar /i })
    await user.click(addButtons[0])
    await user.click(addButtons[0])

    const cartBar = screen.getByRole('button', { name: /ver pedido/i })
    expect(cartBar).toHaveTextContent('2')
    await user.click(cartBar)

    const dialog = await screen.findByRole('dialog')
    const notes = within(dialog).getByPlaceholderText(/sin cebolla/i)
    await user.type(notes, 'sin orégano')
    await user.click(within(dialog).getByRole('button', { name: /confirmar y enviar/i }))

    // El carrito se vació y el toast confirma
    expect(screen.queryByRole('button', { name: /ver pedido/i })).not.toBeInTheDocument()
    expect(await screen.findByText(/pedido enviado/i)).toBeInTheDocument()

    // El mozo ve la comanda de la Mesa 4 con la nota
    await user.click(screen.getByRole('link', { name: /mozo/i }))
    expect(await screen.findByRole('heading', { level: 1, name: /panel del mozo/i })).toBeInTheDocument()
    expect(screen.getByText('sin orégano')).toBeInTheDocument()
  })
})
