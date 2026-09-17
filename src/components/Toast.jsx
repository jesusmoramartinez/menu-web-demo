import { CheckCircle2, Info } from 'lucide-react'
import { useRestaurant } from '../context/RestaurantContext'

export default function Toast() {
  const { toast } = useRestaurant()
  if (!toast) return null

  const Icon = toast.tone === 'info' ? Info : CheckCircle2
  const color = toast.tone === 'info' ? 'bg-sky-600' : 'bg-emerald-600'

  return (
    <div
      key={toast.id}
      className="pointer-events-none fixed inset-x-0 top-16 z-[60] flex justify-center px-4 animate-fade-in"
    >
      <div className={`flex items-center gap-2 rounded-full ${color} px-4 py-2 text-sm font-medium text-white shadow-lg`}>
        <Icon size={16} />
        {toast.message}
      </div>
    </div>
  )
}
