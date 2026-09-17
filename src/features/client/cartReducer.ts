import type { CartLine } from '@/types/domain'

export interface CartState {
  lines: CartLine[]
}

export type NewCartLine = Omit<CartLine, 'key' | 'qty'> & { qty?: number }

export type CartAction =
  | { type: 'ADD'; line: NewCartLine }
  | { type: 'SET_QTY'; key: string; qty: number }
  | { type: 'SET_NOTES'; key: string; notes: string }
  | { type: 'CLEAR' }

export const emptyCart: CartState = { lines: [] }

/** Dos líneas con el mismo plato y las mismas opciones se fusionan (las notas se editan en la línea). */
export const lineKey = (itemId: string, optionIds: string[]) => `${itemId}|${[...optionIds].sort().join(',')}`

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD': {
      const key = lineKey(action.line.itemId, action.line.optionIds)
      const qty = Math.max(1, action.line.qty ?? 1)
      const existing = state.lines.find((l) => l.key === key)
      if (existing) {
        return {
          lines: state.lines.map((l) =>
            l.key === key ? { ...l, qty: l.qty + qty, notes: action.line.notes || l.notes } : l,
          ),
        }
      }
      const { qty: _ignored, ...rest } = action.line
      void _ignored
      return { lines: [...state.lines, { ...rest, key, qty }] }
    }
    case 'SET_QTY':
      return {
        lines: state.lines.map((l) => (l.key === action.key ? { ...l, qty: action.qty } : l)).filter((l) => l.qty > 0),
      }
    case 'SET_NOTES':
      return { lines: state.lines.map((l) => (l.key === action.key ? { ...l, notes: action.notes } : l)) }
    case 'CLEAR':
      return emptyCart
    default:
      return state
  }
}

export const cartTotal = (state: CartState) => state.lines.reduce((s, l) => s + l.unitPrice * l.qty, 0)
export const cartCount = (state: CartState) => state.lines.reduce((s, l) => s + l.qty, 0)
