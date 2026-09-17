import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'
import { DemoLayout } from '@/features/demo/DemoLayout'
import { StaffLayout } from '@/features/staff/StaffLayout'
import { DEMO_CLIENT_PATH } from '@/services/demo'
import { ClientLayout, KitchenView, LandingPage, LoginPage, RegisterPage, RootLayout, WaiterView } from './RootLayout'
import { RouteError } from './RouteError'

/**
 * Rutas de la app. Exportadas aparte para poder montarlas en tests con createMemoryRouter.
 *
 *  /                        landing
 *  /r/:slug/m/:tableToken   comensal (QR de la mesa)
 *  /demo/*                  tenant demo sin login: cliente (m/:token), mozo, cocina
 *  /login · /registro       auth del personal
 *  /mozo · /cocina          staff real, con guard por rol (StaffLayout)
 *  (Fase 5+)                /admin
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'r/:slug/m/:tableToken', element: <ClientLayout /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'registro', element: <RegisterPage /> },
      {
        path: 'demo',
        element: <DemoLayout />,
        children: [
          { index: true, element: <Navigate to={DEMO_CLIENT_PATH} replace /> },
          { path: 'cliente', element: <Navigate to={DEMO_CLIENT_PATH} replace /> },
          { path: 'm/:tableToken', element: <ClientLayout slug="demo" /> },
          { path: 'mozo', element: <WaiterView /> },
          { path: 'cocina', element: <KitchenView /> },
        ],
      },
      {
        path: 'mozo',
        element: <StaffLayout allowedRoles={['waiter']} />,
        children: [{ index: true, element: <WaiterView /> }],
      },
      {
        path: 'cocina',
        element: <StaffLayout allowedRoles={['kitchen']} />,
        children: [{ index: true, element: <KitchenView /> }],
      },
    ],
  },
]

export const router = createBrowserRouter(routes)
