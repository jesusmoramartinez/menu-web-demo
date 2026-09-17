import { useEffect, useState } from 'react'

/** Devuelve Date.now() actualizado cada `interval` ms. Útil para "tiempo transcurrido". */
export function useNow(interval = 15_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), interval)
    return () => clearInterval(t)
  }, [interval])
  return now
}
