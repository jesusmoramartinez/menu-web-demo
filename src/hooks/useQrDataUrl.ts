import QRCode from 'qrcode'
import { useEffect, useState } from 'react'

/** Genera el data URL de un QR (memoizado por texto) para <img> o para descargar. */
export function useQrDataUrl(text: string, size = 320): string | null {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    QRCode.toDataURL(text, { width: size, margin: 1, color: { dark: '#1c1917', light: '#ffffff' } })
      .then((url) => {
        if (active) setDataUrl(url)
      })
      .catch(() => {
        if (active) setDataUrl(null)
      })
    return () => {
      active = false
    }
  }, [text, size])
  return dataUrl
}
