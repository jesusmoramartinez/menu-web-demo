import { Suspense, type CSSProperties } from 'react'
import { Outlet } from 'react-router'
import { ErrorState } from '@/components/ui/ErrorState'
import { PageSpinner } from '@/components/ui/PageSpinner'
import { useRealtimeInvalidation, useRestaurantBySlug } from '@/hooks/useQueries'
import { DEMO_SLUG } from '@/services/demo'
import { RestaurantScopeContext } from '@/features/staff/restaurant-scope-context'
import { DemoBar } from './DemoBar'

/** Altura de la barra de la demo, para que los sticky de las vistas se apilen debajo. */
const layoutStyle = { '--topbar-h': '52px' } as CSSProperties

/** Envuelve las vistas de la demo con el restaurante demo (sin login) y la barra de roles. */
export function DemoLayout() {
  const query = useRestaurantBySlug(DEMO_SLUG)
  useRealtimeInvalidation(query.data?.id)

  if (query.isPending) return <PageSpinner label="Cargando la demo…" />
  if (query.isError) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <ErrorState error={query.error} onRetry={() => query.refetch()} title="No pudimos cargar la demo" />
      </div>
    )
  }
  if (!query.data) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-bold">La demo no está disponible</h1>
        <p className="mt-2 text-sm text-stone-600">El restaurante demo no existe en la base. Ejecutá `select public.reset_demo()`.</p>
      </div>
    )
  }

  return (
    <RestaurantScopeContext.Provider value={{ restaurant: query.data }}>
      <div style={layoutStyle}>
        <DemoBar />
        <Suspense fallback={<PageSpinner />}>
          <Outlet />
        </Suspense>
      </div>
    </RestaurantScopeContext.Provider>
  )
}
