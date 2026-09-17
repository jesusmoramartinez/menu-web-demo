import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useFocusTrap } from '@/hooks/useFocusTrap'

interface ModalProps {
  open: boolean
  onClose: () => void
  /** id del elemento que titula el diálogo (aria-labelledby) */
  labelledBy?: string
  /** clases del panel (posición, tamaño, animación) */
  panelClassName: string
  children: ReactNode
}

/**
 * Base accesible para diálogos: portal a <body>, overlay con cierre por click,
 * cierre con Escape, bloqueo de scroll del fondo y focus trap.
 */
export function Modal({ open, onClose, labelledBy, panelClassName, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, open)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const prevOverflow = document.body.style.overflow
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={labelledBy} className={panelClassName}>
        {children}
      </div>
    </div>,
    document.body,
  )
}

interface SheetProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: ReactNode
  icon?: ReactNode
  children: ReactNode
  footer?: ReactNode
}

/** Hoja inferior en móvil / modal centrado en pantallas grandes, con cabecera, cuerpo scrolleable y pie. */
export function Sheet({ open, onClose, title, subtitle, icon, children, footer }: SheetProps) {
  const titleId = useId()
  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      panelClassName="relative flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-white shadow-2xl animate-slide-up sm:max-w-lg sm:rounded-3xl"
    >
      <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <h2 id={titleId} className="font-bold">
              {title}
            </h2>
            {subtitle && <p className="text-xs text-stone-500">{subtitle}</p>}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-stone-500 hover:bg-stone-100"
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

      {footer && <div className="border-t border-stone-200 px-5 py-4">{footer}</div>}
    </Modal>
  )
}
