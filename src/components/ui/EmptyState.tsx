import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  subtitle?: string
}

export function EmptyState({ icon: Icon, title, subtitle }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-12 text-center">
      {Icon && <Icon size={36} className="mb-3 text-stone-300" aria-hidden="true" />}
      <p className="font-semibold text-stone-700">{title}</p>
      {subtitle && <p className="mt-1 text-sm text-stone-500">{subtitle}</p>}
    </div>
  )
}
