import { useMutation } from '@tanstack/react-query'
import { ImagePlus, Upload } from 'lucide-react'
import { useRef } from 'react'
import { useToast } from '@/hooks/useToast'
import { toAppError } from '@/lib/errors'
import { uploadRestaurantMedia } from '@/services/media'

const inputCls =
  'w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'

interface ImageUploadFieldProps {
  label: string
  restaurantId: string
  folder: 'logo' | 'menu'
  value: string | null
  onChange: (url: string | null) => void
}

/** URL de imagen editable a mano, o subida a Storage (llena la URL sola al terminar). */
export function ImageUploadField({ label, restaurantId, folder, value, onChange }: ImageUploadFieldProps) {
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)

  const upload = useMutation({
    mutationFn: (file: File) => uploadRestaurantMedia(restaurantId, folder, file),
    onSuccess: (url) => onChange(url),
    onError: (err) => toast.show(toAppError(err, 'No se pudo subir la imagen.').message, 'error'),
  })

  return (
    <div>
      <span className="text-sm font-semibold">{label}</span>
      <div className="mt-1 flex items-start gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-stone-100 ring-1 ring-stone-200">
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <ImagePlus size={22} className="text-stone-300" aria-hidden="true" />}
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <input
            type="url"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value || null)}
            placeholder="https://…"
            className={inputCls}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={upload.isPending}
            className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:underline disabled:opacity-50"
          >
            <Upload size={13} aria-hidden="true" /> {upload.isPending ? 'Subiendo…' : 'Subir desde el dispositivo'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) upload.mutate(file)
            }}
          />
        </div>
      </div>
    </div>
  )
}
