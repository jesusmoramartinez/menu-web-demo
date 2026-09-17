import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import { toAppError } from '@/lib/errors'
import { qk } from '@/lib/queryKeys'
import {
  deleteCategory,
  deleteMenuItem,
  deleteOption,
  deleteOptionGroup,
  saveCategory,
  saveMenuItem,
  saveOption,
  saveOptionGroup,
  setCategoryActive,
  setItemAvailable,
  setSoldOutToday,
  updateItemPrice,
} from '@/services/menuAdmin'
import { updateRestaurantSettings } from '@/services/settingsAdmin'
import { createInvite, deleteInvite, replaceAssignments, setStaffActive, updateStaffRole } from '@/services/staffAdmin'
import { deleteSector, saveSector, saveTable, setTableActive } from '@/services/tablesAdmin'

/** Mutaciones de "Menú" (categorías, platos, variantes): invalidan qk.admin(rid) al terminar. */
export function useMenuAdminMutations(restaurantId: string) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: qk.admin(restaurantId) })
  const onError = (err: unknown) => toast.show(toAppError(err, 'No se pudo guardar el cambio.').message, 'error')

  const saveCategoryM = useMutation({ mutationFn: (input: Parameters<typeof saveCategory>[1]) => saveCategory(restaurantId, input), onSuccess: invalidate, onError })
  const setCategoryActiveM = useMutation({ mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => setCategoryActive(id, isActive), onSuccess: invalidate, onError })
  const deleteCategoryM = useMutation({ mutationFn: deleteCategory, onSuccess: invalidate, onError })

  const saveMenuItemM = useMutation({ mutationFn: (input: Parameters<typeof saveMenuItem>[1]) => saveMenuItem(restaurantId, input), onSuccess: invalidate, onError })
  const deleteMenuItemM = useMutation({ mutationFn: deleteMenuItem, onSuccess: invalidate, onError })
  const setItemAvailableM = useMutation({ mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) => setItemAvailable(id, isAvailable), onSuccess: invalidate, onError })
  const setSoldOutTodayM = useMutation({ mutationFn: ({ id, soldOut }: { id: string; soldOut: boolean }) => setSoldOutToday(id, soldOut), onSuccess: invalidate, onError })
  const updateItemPriceM = useMutation({ mutationFn: ({ id, price }: { id: string; price: number }) => updateItemPrice(id, price), onSuccess: invalidate, onError })

  const saveOptionGroupM = useMutation({ mutationFn: (input: Parameters<typeof saveOptionGroup>[1]) => saveOptionGroup(restaurantId, input), onSuccess: invalidate, onError })
  const deleteOptionGroupM = useMutation({ mutationFn: deleteOptionGroup, onSuccess: invalidate, onError })
  const saveOptionM = useMutation({ mutationFn: (input: Parameters<typeof saveOption>[1]) => saveOption(restaurantId, input), onSuccess: invalidate, onError })
  const deleteOptionM = useMutation({ mutationFn: deleteOption, onSuccess: invalidate, onError })

  return {
    saveCategory: saveCategoryM,
    setCategoryActive: setCategoryActiveM,
    deleteCategory: deleteCategoryM,
    saveMenuItem: saveMenuItemM,
    deleteMenuItem: deleteMenuItemM,
    setItemAvailable: setItemAvailableM,
    setSoldOutToday: setSoldOutTodayM,
    updateItemPrice: updateItemPriceM,
    saveOptionGroup: saveOptionGroupM,
    deleteOptionGroup: deleteOptionGroupM,
    saveOption: saveOptionM,
    deleteOption: deleteOptionM,
  }
}

/** Mutaciones de "Mesas y sectores". */
export function useTablesAdminMutations(restaurantId: string) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: qk.admin(restaurantId) })
  const onError = (err: unknown) => toast.show(toAppError(err, 'No se pudo guardar el cambio.').message, 'error')

  const saveSectorM = useMutation({ mutationFn: (input: Parameters<typeof saveSector>[1]) => saveSector(restaurantId, input), onSuccess: invalidate, onError })
  const deleteSectorM = useMutation({ mutationFn: deleteSector, onSuccess: invalidate, onError })
  const saveTableM = useMutation({ mutationFn: (input: Parameters<typeof saveTable>[1]) => saveTable(restaurantId, input), onSuccess: invalidate, onError })
  const setTableActiveM = useMutation({ mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => setTableActive(id, isActive), onSuccess: invalidate, onError })

  return { saveSector: saveSectorM, deleteSector: deleteSectorM, saveTable: saveTableM, setTableActive: setTableActiveM }
}

/** Mutaciones de "Personal": rol, activo/inactivo, invitaciones, asignaciones. */
export function useStaffAdminMutations(restaurantId: string) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: qk.admin(restaurantId) })
  const onError = (err: unknown) => toast.show(toAppError(err, 'No se pudo guardar el cambio.').message, 'error')

  const updateRole = useMutation({ mutationFn: ({ id, role }: { id: string; role: Parameters<typeof updateStaffRole>[1] }) => updateStaffRole(id, role), onSuccess: invalidate, onError })
  const setActive = useMutation({ mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => setStaffActive(id, isActive), onSuccess: invalidate, onError })
  const createInviteM = useMutation({ mutationFn: (input: Parameters<typeof createInvite>[1]) => createInvite(restaurantId, input), onSuccess: invalidate, onError })
  const deleteInviteM = useMutation({ mutationFn: deleteInvite, onSuccess: invalidate, onError })
  const saveAssignments = useMutation({
    mutationFn: ({ staffId, sectorIds, tableIds }: { staffId: string; sectorIds: string[]; tableIds: string[] }) =>
      replaceAssignments(restaurantId, staffId, sectorIds, tableIds),
    onSuccess: invalidate,
    onError,
  })

  return { updateRole, setActive, createInvite: createInviteM, deleteInvite: deleteInviteM, saveAssignments }
}

/** Mutación de "Configuración" del restaurante. */
export function useSettingsAdminMutation(restaurantId: string) {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: Parameters<typeof updateRestaurantSettings>[1]) => updateRestaurantSettings(restaurantId, input),
    onSuccess: () => {
      // el nombre/logo/color viven en useMyStaff (y en useRestaurantBySlug para la demo)
      void queryClient.invalidateQueries({ queryKey: qk.admin(restaurantId) })
      void queryClient.invalidateQueries({ queryKey: ['my-staff'] })
      void queryClient.invalidateQueries({ queryKey: ['restaurant-by-slug'] })
      toast.show('Configuración guardada')
    },
    onError: (err) => toast.show(toAppError(err, 'No se pudo guardar la configuración.').message, 'error'),
  })
}
