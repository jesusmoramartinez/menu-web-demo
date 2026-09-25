import { AlertTriangle, UserX } from 'lucide-react'
import { Suspense, type ReactNode } from 'react'
import { Link, Navigate, Outlet, useLocation } from 'react-router'
import { ErrorState } from '@/components/ui/ErrorState'
import { PageSpinner } from '@/components/ui/PageSpinner'
import { useAuth } from '@/hooks/useAuth'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useMyStaff, useRealtimeInvalidation } from '@/hooks/useQueries'
import { brandStyle } from '@/lib/brandStyle'
import type { StaffRole } from '@/types/domain'
import { RestaurantScopeContext } from './restaurant-scope-context'
import { roleHome } from './roleHome'
import { StaffTopBar } from './StaffTopBar'

interface StaffLayoutProps {
  /** roles que pueden ver las rutas hijas (además de owner/admin, que siempre pueden) */
  allowedRoles: StaffRole[]
}

function Centered({ children }: { children: ReactNode }) {
  return <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">{children}</div>
}

/**
 * Guard de las rutas reales de staff (/mozo, /cocina): exige sesión, resuelve el
 * restaurante desde la fila `staff` del usuario y valida el rol antes de montar
 * las vistas (que son las mismas que usa la demo, vía RestaurantScopeContext).
 */
export function StaffLayout({ allowedRoles }: StaffLayoutProps) {
  const { session, userId, loading } = useAuth()
  const location = useLocation()
  const myStaff = useMyStaff(userId)
  useRealtimeInvalidation(myStaff.data?.restaurant.id)
  useDocumentTitle(myStaff.data ? `${myStaff.data.restaurant.name} · Menú Digital` : undefined)

  if (loading) return <PageSpinner label="Verificando sesión…" />
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />

  if (myStaff.isPending) return <PageSpinner label="Cargando tu cuenta…" />
  if (myStaff.isError) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <ErrorState error={myStaff.error} onRetry={() => myStaff.refetch()} title="No pudimos cargar tu cuenta" />
      </div>
    )
  }

  if (!myStaff.data) {
    return (
      <Centered>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
          <UserX size={28} aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-xl font-bold">Tu cuenta todavía no está asociada a un restaurante</h1>
        <p className="mt-2 max-w-sm text-stone-600">Pedile al dueño del local un código de invitación, o creá tu propio restaurante.</p>
        <Link to="/registro" className="mt-5 font-semibold text-brand-700 hover:underline">
          Ir a completar el alta
        </Link>
      </Centered>
    )
  }

  const { staff, restaurant } = myStaff.data

  if (!staff.isActive) {
    return (
      <Centered>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
          <UserX size={28} aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-xl font-bold">Tu acceso fue desactivado</h1>
        <p className="mt-2 max-w-sm text-stone-600">Hablá con el dueño o encargado de {restaurant.name} para reactivarlo.</p>
      </Centered>
    )
  }

  const canSee = staff.role === 'owner' || staff.role === 'admin' || allowedRoles.includes(staff.role)
  if (!canSee) {
    return (
      <Centered>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
          <AlertTriangle size={28} aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-xl font-bold">No tenés permiso para ver esta pantalla</h1>
        <Link to={roleHome(staff.role)} className="mt-5 font-semibold text-brand-700 hover:underline">
          Ir a tu pantalla
        </Link>
      </Centered>
    )
  }

  return (
    <RestaurantScopeContext.Provider value={{ restaurant, staffId: staff.id, role: staff.role }}>
      <div style={brandStyle(restaurant.theme.brand)}>
        <StaffTopBar staff={staff} restaurant={restaurant} />
        <Suspense fallback={<PageSpinner />}>
          <Outlet />
        </Suspense>
      </div>
    </RestaurantScopeContext.Provider>
  )
}
