import { describe, expect, it } from 'vitest'
import type { MenuItem, OptionGroup } from '@/types/domain'
import { defaultSelection, selectedLabels, toggleOption, unitPrice, validateGroup, validateSelection } from './optionRules'

const size: OptionGroup = {
  id: 'size',
  name: 'Tamaño',
  selection: 'single',
  required: true,
  minSelect: 1,
  maxSelect: 1,
  options: [
    { id: 'grande', name: 'Grande', priceDelta: 0, isAvailable: true },
    { id: 'chica', name: 'Chica', priceDelta: -300000, isAvailable: true },
  ],
}
const extras: OptionGroup = {
  id: 'extras',
  name: 'Extras',
  selection: 'multiple',
  required: false,
  minSelect: 0,
  maxSelect: 2,
  options: [
    { id: 'huevo', name: 'Huevo', priceDelta: 80000, isAvailable: true },
    { id: 'jamon', name: 'Jamón', priceDelta: 120000, isAvailable: true },
    { id: 'trufa', name: 'Trufa', priceDelta: 500000, isAvailable: false },
  ],
}
const pizza: MenuItem = {
  id: 'p1',
  categoryId: 'c1',
  name: 'Muzzarella',
  description: '',
  price: 980000,
  imageUrl: null,
  tags: [],
  soldOut: false,
  optionGroups: [size, extras],
}

describe('validateGroup', () => {
  it('exige una opción en grupos obligatorios', () => {
    expect(validateGroup(size, [])).toBe('Elegí una opción')
    expect(validateGroup(size, ['grande'])).toBeNull()
  })
  it('limita single a una y multiple a max_select', () => {
    expect(validateGroup(size, ['grande', 'chica'])).toBe('Sólo una opción')
    expect(validateGroup(extras, ['huevo', 'jamon'])).toBeNull()
    expect(validateGroup(extras, ['huevo', 'jamon', 'trufa'])).toBe('Como máximo 2')
  })
  it('validateSelection devuelve errores por grupo', () => {
    expect(validateSelection([size, extras], { size: [], extras: [] })).toEqual({ size: 'Elegí una opción' })
    expect(validateSelection([size, extras], { size: ['chica'] })).toEqual({})
  })
})

describe('defaultSelection / toggleOption', () => {
  it('preselecciona la primera opción disponible en single obligatorios', () => {
    expect(defaultSelection([size, extras])).toEqual({ size: ['grande'], extras: [] })
  })
  it('single reemplaza; multiple alterna', () => {
    expect(toggleOption(size, ['grande'], 'chica')).toEqual(['chica'])
    expect(toggleOption(extras, [], 'huevo')).toEqual(['huevo'])
    expect(toggleOption(extras, ['huevo'], 'jamon')).toEqual(['huevo', 'jamon'])
    expect(toggleOption(extras, ['huevo', 'jamon'], 'huevo')).toEqual(['jamon'])
  })
  it('single opcional se puede destildar', () => {
    const optional = { ...size, required: false, minSelect: 0 }
    expect(toggleOption(optional, ['grande'], 'grande')).toEqual([])
  })
})

describe('unitPrice / selectedLabels', () => {
  it('suma los deltas de las opciones elegidas y nunca baja de 0', () => {
    expect(unitPrice(pizza, { size: ['grande'] })).toBe(980000)
    expect(unitPrice(pizza, { size: ['chica'], extras: ['huevo', 'jamon'] })).toBe(980000 - 300000 + 80000 + 120000)
    expect(unitPrice({ ...pizza, price: 100000 }, { size: ['chica'] })).toBe(0)
  })
  it('devuelve las etiquetas en el orden de los grupos', () => {
    expect(selectedLabels(pizza, { extras: ['jamon'], size: ['chica'] })).toEqual(['Chica', 'Jamón'])
  })
})
