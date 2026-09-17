import { Suspense } from 'react'
import { Outlet } from 'react-router'
import { PageSpinner } from '@/components/ui/PageSpinner'
import { RestaurantProvider } from '@/store/RestaurantProvider'
import { DemoBar } from './DemoBar'

/** Envuelve las tres vistas de la demo con el store local y la barra de roles. */
export function DemoLayout() {
  return (
    <RestaurantProvider>
      <DemoBar />
      <Suspense fallback={<PageSpinner />}>
        <Outlet />
      </Suspense>
    </RestaurantProvider>
  )
}
