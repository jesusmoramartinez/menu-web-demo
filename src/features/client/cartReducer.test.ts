import { describe, expect, it } from 'vitest'
import { cartCount, cartReducer, cartTotal, emptyCart, lineKey, type NewCartLine } from './cartReducer'

const muzza: NewCartLine = {
  itemId: 'p1',
  name: 'Muzzarella',
  unitPrice: 980000,
  notes: '',
  optionIds: ['grande'],
  optionLabels: ['Grande'],
}

describe('cartReducer', () => {
  it('agrega una línea con clave = plato + opciones ordenadas', () => {
    const s = cartReducer(emptyCart, { type: 'ADD', line: muzza })
    expect(s.lines).toHaveLength(1)
    expect(s.lines[0]).toMatchObject({ key: lineKey('p1', ['grande']), qty: 1, unitPrice: 980000 })
    expect(lineKey('p1', ['b', 'a'])).toBe(lineKey('p1', ['a', 'b']))
  })

  it('fusiona el mismo plato con las mismas opciones y separa variantes distintas', () => {
    let s = cartReducer(emptyCart, { type: 'ADD', line: muzza })
    s = cartReducer(s, { type: 'ADD', line: { ...muzza, qty: 2 } })
    expect(s.lines).toHaveLength(1)
    expect(s.lines[0].qty).toBe(3)
    s = cartReducer(s, { type: 'ADD', line: { ...muzza, optionIds: ['chica'], optionLabels: ['Chica'], unitPrice: 680000 } })
    expect(s.lines).toHaveLength(2)
  })

  it('conserva las notas existentes si la nueva línea no trae', () => {
    let s = cartReducer(emptyCart, { type: 'ADD', line: { ...muzza, notes: 'bien cocida' } })
    s = cartReducer(s, { type: 'ADD', line: muzza })
    expect(s.lines[0].notes).toBe('bien cocida')
  })

  it('SET_QTY a 0 elimina la línea; SET_NOTES edita; CLEAR vacía', () => {
    let s = cartReducer(emptyCart, { type: 'ADD', line: muzza })
    const key = s.lines[0].key
    s = cartReducer(s, { type: 'SET_NOTES', key, notes: 'sin orégano' })
    expect(s.lines[0].notes).toBe('sin orégano')
    s = cartReducer(s, { type: 'SET_QTY', key, qty: 4 })
    expect(cartCount(s)).toBe(4)
    expect(cartTotal(s)).toBe(4 * 980000)
    s = cartReducer(s, { type: 'SET_QTY', key, qty: 0 })
    expect(s.lines).toHaveLength(0)
    s = cartReducer(cartReducer(s, { type: 'ADD', line: muzza }), { type: 'CLEAR' })
    expect(s).toBe(emptyCart)
  })
})
