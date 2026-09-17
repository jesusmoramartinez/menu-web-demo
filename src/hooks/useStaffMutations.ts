import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import { toAppError } from '@/lib/errors'
import { qk } from '@/lib/queryKeys'
import { resolveAlert } from '@/services/alerts'
import { updateOrderItems, updateOrderStatus, type OrderItemEdit } from '@/services/orders'
import { closeTableSession } from '@/services/tables'
import type { OrderStatus } from '@/types/domain'

/** Mutaciones del staff con invalidación de las queries del restaurante y toasts de error. */
export function useStaffMutations(restaurantId: string) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: qk.staff(restaurantId) })
  const onError = (err: unknown) => toast.show(toAppError(err, 'No se pudo guardar el cambio.').message, 'error')

  const setStatus = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) => updateOrderStatus(orderId, status),
    onSuccess: invalidate,
    onError,
  })

  const editItems = useMutation({
    mutationFn: ({ orderId, keep, removeIds }: { orderId: string; keep: OrderItemEdit[]; removeIds: string[] }) =>
      updateOrderItems(orderId, keep, removeIds),
    onSuccess: invalidate,
    onError,
  })

  const resolve = useMutation({
    mutationFn: (alertId: string) => resolveAlert(alertId),
    onSuccess: invalidate,
    onError,
  })

  const closeSession = useMutation({
    mutationFn: (sessionId: string) => closeTableSession(sessionId),
    onSuccess: invalidate,
    onError,
  })

  return { setStatus, editItems, resolve, closeSession }
}
