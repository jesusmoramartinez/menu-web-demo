import { QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense, useState } from 'react'
import { Outlet } from 'react-router'
import { OfflineBanner } from '@/components/ui/OfflineBanner'
import { PageSpinner } from '@/components/ui/PageSpinner'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { createAppQueryClient } from './queryClient'

// Cada vista se carga por separado (code-splitting por rol)
export const LandingPage = lazy(() => import('@/features/landing/LandingPage'))
export const ClientLayout = lazy(() => import('@/features/client/ClientLayout'))
export const WaiterView = lazy(() => import('@/features/waiter/WaiterView'))
export const KitchenView = lazy(() => import('@/features/kitchen/KitchenView'))

export function RootLayout() {
  const [queryClient] = useState(createAppQueryClient)
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Suspense fallback={<PageSpinner />}>
          <Outlet />
        </Suspense>
        <OfflineBanner />
      </ToastProvider>
    </QueryClientProvider>
  )
}
