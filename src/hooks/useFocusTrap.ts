import { useEffect, type RefObject } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Mantiene el foco dentro de `ref` mientras `active` sea true (Tab / Shift+Tab ciclan),
 * enfoca el primer elemento al abrir y devuelve el foco al elemento anterior al cerrar.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active) return
    const node = ref.current
    if (!node) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    const focusables = () => Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE))

    const first = focusables()[0]
    if (first) first.focus()
    else {
      node.tabIndex = -1
      node.focus()
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const els = focusables()
      if (els.length === 0) {
        e.preventDefault()
        return
      }
      const firstEl = els[0]
      const lastEl = els[els.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }

    node.addEventListener('keydown', onKey)
    return () => {
      node.removeEventListener('keydown', onKey)
      previouslyFocused?.focus?.()
    }
  }, [ref, active])
}
