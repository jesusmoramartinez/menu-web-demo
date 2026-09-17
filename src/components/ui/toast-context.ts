import { createContext } from 'react'
import type { ToastTone } from '@/types/domain'

export interface ToastApi {
  show: (message: string, tone?: ToastTone) => void
}

export const ToastContext = createContext<ToastApi | null>(null)
