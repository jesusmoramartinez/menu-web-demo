import { WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'

function useOnline() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => {
      window.removeEventListener('online', up)
      window.removeEventListener('offline', down)
    }
  }, [])
  return online
}

/** Aviso fijo cuando el dispositivo pierde conexión. */
export function OfflineBanner() {
  const online = useOnline()
  if (online) return null
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[55] flex items-center justify-center gap-2 bg-stone-900 px-4 py-2 text-sm font-medium text-white"
      role="status"
    >
      <WifiOff size={16} aria-hidden="true" /> Sin conexión: los cambios se verán al reconectar.
    </div>
  )
}
