import { AlertTriangle } from 'lucide-react'
import { useId } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}

/** Reemplazo accesible de window.confirm. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'primary',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId()
  return (
    <Modal
      open={open}
      onClose={onCancel}
      labelledBy={titleId}
      panelClassName="relative m-4 w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl animate-fade-in"
    >
      <div className="flex gap-3">
        {tone === 'danger' && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertTriangle size={20} />
          </div>
        )}
        <div className="min-w-0">
          <h2 id={titleId} className="font-bold">
            {title}
          </h2>
          {description && <p className="mt-1 text-sm text-stone-600">{description}</p>}
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant={tone === 'danger' ? 'dangerSolid' : 'primary'} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
