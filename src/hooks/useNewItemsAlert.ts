import { useEffect, useRef } from 'react'
import { hasNewIds } from '@/lib/hasNewIds'
import { notifyNewItem } from '@/lib/sound'

/**
 * Dispara sonido + vibración cuando aparece un id que no estaba en la lista
 * anterior. Ignora el primer montaje (no suena por lo que ya había al abrir la
 * pantalla) y no hace nada mientras `enabled` es false.
 */
export function useNewItemsAlert(ids: string[], enabled: boolean): void {
  const seen = useRef<Set<string> | null>(null)

  useEffect(() => {
    if (seen.current === null) {
      seen.current = new Set(ids) // primer render: sólo registra, no suena
      return
    }
    const isNew = hasNewIds(seen.current, ids)
    seen.current = new Set(ids)
    if (isNew && enabled) notifyNewItem()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(','), enabled])
}
