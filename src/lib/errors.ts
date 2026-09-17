/**
 * Traduce los códigos que lanzan las RPCs (raise exception 'CODIGO: detalle')
 * a mensajes para el comensal / el staff.
 */
const MESSAGES: Record<string, (detail: string) => string> = {
  EMPTY_ORDER: () => 'El carrito está vacío.',
  TOO_MANY_ITEMS: () => 'Demasiados ítems en un solo pedido. Dividilo en dos.',
  TABLE_NOT_FOUND: () => 'Esta mesa no existe o está inactiva. Pedile al personal un QR actualizado.',
  ITEM_NOT_FOUND: () => 'Un plato del carrito ya no está en el menú. Actualizá la página.',
  ITEM_UNAVAILABLE: (d) => `"${d}" se agotó por hoy. Quitalo del carrito para continuar.`,
  INVALID_QTY: () => 'Cantidad inválida.',
  OPTION_REQUIRED: (d) => `Falta elegir una opción en "${d}".`,
  OPTION_MIN: (d) => `Elegí más opciones en "${d}".`,
  OPTION_MAX: (d) => `Elegiste demasiadas opciones en "${d}".`,
  OPTION_SINGLE: (d) => `Sólo podés elegir una opción en "${d}".`,
  OPTION_INVALID: () => 'Alguna opción elegida ya no está disponible. Volvé a armar el plato.',
  NOT_AUTHENTICATED: () => 'Tenés que iniciar sesión.',
  ALREADY_STAFF: () => 'Tu usuario ya pertenece a un restaurante.',
  INVITE_INVALID: () => 'El código de invitación no es válido o venció.',
  INVITE_EMAIL_MISMATCH: () => 'Esa invitación es para otro email.',
  SLUG_INVALID: () => 'La dirección del restaurante sólo puede tener letras minúsculas, números y guiones.',
  SLUG_TAKEN: () => 'Esa dirección ya está en uso. Probá otra.',
}

export class AppError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.name = 'AppError'
    this.code = code
  }
}

/** Convierte cualquier error (PostgrestError, Error, string) en AppError con mensaje legible. */
export function toAppError(err: unknown, fallback = 'Algo salió mal. Probá de nuevo.'): AppError {
  if (err instanceof AppError) return err
  const raw = typeof err === 'string' ? err : ((err as { message?: string })?.message ?? '')
  const match = /^([A-Z_]+)(?::\s*(.*))?$/.exec(raw.trim())
  if (match) {
    const [, code, detail = ''] = match
    const fn = MESSAGES[code]
    if (fn) return new AppError(code, fn(detail))
  }
  if (/fetch|network|Failed to fetch/i.test(raw)) {
    return new AppError('NETWORK', 'Sin conexión. Revisá tu internet y volvé a intentar.')
  }
  return new AppError('UNKNOWN', fallback)
}
