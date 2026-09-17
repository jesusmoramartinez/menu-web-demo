import { lazy, Suspense } from 'react'
import { Outlet } from 'react-router'
import { PageSpinner } from '@/components/ui/PageSpinner'
import { ToastProvider } from '@/components/ui/ToastProvider'

// Cada vista se carga por separado (code-splitting por rol)
export const LandingPage = lazy(() => import('@/features/landing/LandingPage'))
export const ClientView = lazy(() => import('@/features/client/ClientView'))
export const WaiterView = lazy(() => import('@/features/waiter/WaiterView'))
export const KitchenView = lazy(() => import('@/features/kitchen/KitchenView'))

export function RootLayout() {
  return (
    <ToastProvider>
      <Suspense fallback={<PageSpinner />}>
        <Outlet />
      </Suspense>
    </ToastProvider>
  )
}
