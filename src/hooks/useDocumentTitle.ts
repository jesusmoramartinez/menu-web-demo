import { useEffect } from 'react'

/**
 * Pone `document.title` mientras el componente está montado y restaura el valor anterior
 * al desmontar. Cada tenant (real o demo) tiene su propio nombre — sin esto, todo el mundo
 * ve el título de la pestaña hardcodeado en `index.html` (el de la demo).
 */
export function useDocumentTitle(title: string | undefined) {
  useEffect(() => {
    if (!title) return
    const previous = document.title
    document.title = title
    return () => {
      document.title = previous
    }
  }, [title])
}
