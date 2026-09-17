import { RefreshCw, WifiOff } from 'lucide-react'
import { toAppError } from '@/lib/errors'
import { Button } from './Button'

interface ErrorStateProps {
  error: unknown
  onRetry?: () => void
  title?: string
}

/** Error de carga inline con reintento (para queries fallidas). */
export function ErrorState({ error, onRetry, title = 'No pudimos cargar los datos' }: ErrorStateProps) {
  const err = toAppError(error, 'Revisá la conexión y volvé a intentar.')
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-red-200 bg-red-50/60 px-6 py-10 text-center" role="alert">
      <WifiOff size={32} className="mb-3 text-red-400" aria-hidden="true" />
      <p className="font-semibold text-stone-800">{title}</p>
      <p className="mt-1 text-sm text-stone-600">{err.message}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-4" icon={<RefreshCw size={16} />} onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  )
}
