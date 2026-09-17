import { PartyPopper, UtensilsCrossed } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/lib/format'

interface ThanksScreenProps {
  restaurantName: string
  total: number
  currency: string
  onRestart: () => void
}

/** La mesa fue cerrada por el personal: despedida y opción de empezar de nuevo. */
export function ThanksScreen({ restaurantName, total, currency, onRestart }: ThanksScreenProps) {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-100 text-brand-600">
        <PartyPopper size={32} aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-2xl font-bold">¡Gracias por tu visita!</h2>
      <p className="mt-2 max-w-sm text-stone-600">
        La mesa ya fue cerrada. Esperamos verte de nuevo en {restaurantName}.
      </p>
      {total > 0 && (
        <p className="mt-4 rounded-xl bg-white px-4 py-2 text-sm text-stone-600 ring-1 ring-stone-200">
          Consumo de la mesa: <span className="font-bold text-stone-900">{formatPrice(total, currency)}</span>
        </p>
      )}
      <Button variant="secondary" className="mt-6" icon={<UtensilsCrossed size={16} />} onClick={onRestart}>
        Ver el menú de nuevo
      </Button>
    </div>
  )
}
