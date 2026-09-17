import { AlertTriangle, Home, RefreshCw } from 'lucide-react'
import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { Button } from '@/components/ui/Button'

/** Pantalla de error de ruta: 404 o excepción durante el render. */
export function RouteError() {
  const error = useRouteError()
  const notFound = isRouteErrorResponse(error) && error.status === 404

  if (!notFound) console.error(error)

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-stone-50 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
        <AlertTriangle size={28} aria-hidden="true" />
      </div>
      <h1 className="mt-4 text-2xl font-bold">{notFound ? 'Página no encontrada' : 'Algo salió mal'}</h1>
      <p className="mt-2 max-w-sm text-stone-600">
        {notFound
          ? 'La dirección que abriste no existe. Si escaneaste un QR, pedile al personal uno actualizado.'
          : 'Ocurrió un error inesperado. Recargá la página; si persiste, avisá al personal.'}
      </p>
      <div className="mt-6 flex gap-2">
        <Link to="/">
          <Button variant="secondary" icon={<Home size={16} />}>
            Inicio
          </Button>
        </Link>
        {!notFound && (
          <Button icon={<RefreshCw size={16} />} onClick={() => window.location.reload()}>
            Recargar
          </Button>
        )}
      </div>
    </div>
  )
}
