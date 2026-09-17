import { useQrDataUrl } from '@/hooks/useQrDataUrl'

interface QrCodeProps {
  text: string
  size?: number
  alt: string
  className?: string
}

export function QrCode({ text, size = 160, alt, className = '' }: QrCodeProps) {
  const dataUrl = useQrDataUrl(text, size)
  if (!dataUrl) return <div className={`animate-pulse rounded-lg bg-stone-200 ${className}`} style={{ width: size, height: size }} aria-hidden="true" />
  return <img src={dataUrl} alt={alt} width={size} height={size} className={className} />
}
