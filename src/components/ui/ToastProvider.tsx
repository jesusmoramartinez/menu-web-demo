import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { uid } from '@/lib/uid'
import type { ToastTone } from '@/types/domain'
import { ToastContext, type ToastApi } from './toast-context'

interface ToastState {
  id: string
  message: string
  tone: ToastTone
}

const TONES: Record<ToastTone, { Icon: typeof Info; cls: string }> = {
  success: { Icon: CheckCircle2, cls: 'bg-emerald-600' },
  info: { Icon: Info, cls: 'bg-sky-600' },
  error: { Icon: AlertCircle, cls: 'bg-red-600' },
}

const DURATION_MS = 2800

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), DURATION_MS)
    return () => clearTimeout(t)
  }, [toast])

  const api = useMemo<ToastApi>(
    () => ({ show: (message, tone = 'success') => setToast({ id: uid('toast'), message, tone }) }),
    [],
  )

  const tone = toast ? TONES[toast.tone] : null

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-16 z-[60] flex justify-center px-4"
        role="status"
        aria-live="polite"
      >
        {toast && tone && (
          <div
            key={toast.id}
            className={`flex items-center gap-2 rounded-full ${tone.cls} px-4 py-2 text-sm font-medium text-white shadow-lg animate-fade-in`}
          >
            <tone.Icon size={16} aria-hidden="true" />
            {toast.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}
