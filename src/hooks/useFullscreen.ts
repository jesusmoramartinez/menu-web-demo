import { useCallback, useEffect, useState } from 'react'

/** Pantalla completa del documento (útil para dejar el KDS en una tablet sin la barra del navegador). */
export function useFullscreen(): { isFullscreen: boolean; supported: boolean; toggle: () => void } {
  const [supported] = useState(() => typeof document !== 'undefined' && !!document.documentElement.requestFullscreen)
  const [isFullscreen, setIsFullscreen] = useState(() => !!document.fullscreenElement)

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggle = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen().catch(() => {})
  }, [])

  return { isFullscreen, supported, toggle }
}
