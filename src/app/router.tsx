import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'
import { DemoLayout } from '@/features/demo/DemoLayout'
import { DEMO_CLIENT_PATH } from '@/services/demo'
import { ClientLayout, KitchenView, LandingPage, RootLayout, WaiterView } from './RootLayout'
import { RouteError } from './RouteError'

/**
 * Rutas de la app. Exportadas aparte para poder montarlas en tests con createMemoryRouter.
 *
 *  /                        landing
 *  /r/:slug/m/:tableToken   comensal (QR de la mesa)
 *  /demo/*                  tenant demo sin login: cliente (m/:token), mozo, cocina
 *  (Fase 3+)                /login · /registro · /mozo · /cocina · /admin
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'r/:slug/m/:tableToken', element: <ClientLayout /> },
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
    ],
  },
]

export const router = createBrowserRouter(routes)
