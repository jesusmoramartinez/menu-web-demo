import { useMutation } from '@tanstack/react-query'
import { MailCheck } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'
import { toAppError } from '@/lib/errors'
import { resendSignupEmail } from '@/services/auth'

interface ConfirmEmailNoticeProps {
  email: string
}

/** Se muestra después de registrarse cuando el proyecto exige confirmar el email antes de dar una sesión. */
export function ConfirmEmailNotice({ email }: ConfirmEmailNoticeProps) {
  const toast = useToast()
  const [sent, setSent] = useState(false)
  const resend = useMutation({
    mutationFn: () => resendSignupEmail(email),
    onSuccess: () => {
      setSent(true)
      toast.show('Te reenviamos el correo', 'info')
    },
    onError: (err) => toast.show(toAppError(err).message, 'error'),
  })

  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
        <MailCheck size={28} aria-hidden="true" />
      </div>
      <h1 className="mt-4 text-xl font-bold">Revisá tu correo</h1>
      <p className="mt-2 max-w-sm text-sm text-stone-600">
        Te enviamos un link de confirmación a <strong>{email}</strong>. Abrilo para activar tu cuenta; después volvés
        a esta página y seguimos automáticamente. Revisá también la carpeta de spam.
      </p>
      <Button variant="secondary" className="mt-5" onClick={() => resend.mutate()} disabled={resend.isPending || sent}>
        {sent ? 'Correo reenviado' : resend.isPending ? 'Enviando…' : 'Reenviar correo'}
      </Button>
    </div>
  )
}
