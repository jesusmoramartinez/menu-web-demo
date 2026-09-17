import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'
import { DemoLayout } from '@/features/demo/DemoLayout'
import { ClientView, KitchenView, LandingPage, RootLayout, WaiterView } from './RootLayout'
import { RouteError } from './RouteError'

/**
 * Rutas de la app. Exportadas aparte para poder montarlas en tests con createMemoryRouter.
 *
 *  /                 landing
 *  /demo/*           demo con store local (cliente, mozo, cocina)
 *  (Fase 2+)         /r/:slug/m/:tableToken, /login, /mozo, /cocina, /admin
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <LandingPage /> },
      {
        path: 'demo',
        element: <DemoLayout />,
        children: [
          { index: true, element: <Navigate to="cliente" replace /> },
          { path: 'cliente', element: <ClientView /> },
          { path: 'mozo', element: <WaiterView /> },
          { path: 'cocina', element: <KitchenView /> },
        ],
      },
    ],
  },
]

export const router = createBrowserRouter(routes)
