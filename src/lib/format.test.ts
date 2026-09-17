import { describe, expect, it } from 'vitest'
import { countUnits, formatPrice, minutesSince, plural, sumLines, timeAgo } from './format'

describe('formatPrice', () => {
  it('formatea centavos en ARS sin decimales', () => {
    expect(formatPrice(650000)).toMatch(/^\$\s?6\.500$/)
  })
  it('formatea cero', () => {
    expect(formatPrice(0)).toMatch(/^\$\s?0$/)
  })
  it('respeta monedas con decimales', () => {
    expect(formatPrice(1999, 'USD', 'en-US')).toBe('$19.99')
  })
})

describe('timeAgo', () => {
  const now = 1_700_000_000_000
  it('recién para menos de un minuto', () => {
    expect(timeAgo(now - 30_000, now)).toBe('recién')
  })
  it('minutos', () => {
    expect(timeAgo(now - 3 * 60_000, now)).toBe('hace 3 min')
  })
  it('horas exactas y con resto', () => {
    expect(timeAgo(now - 120 * 60_000, now)).toBe('hace 2 h')
    expect(timeAgo(now - 72 * 60_000, now)).toBe('hace 1 h 12 min')
  })
  it('no devuelve valores negativos si el timestamp es futuro', () => {
    expect(timeAgo(now + 60_000, now)).toBe('recién')
  })
})

describe('minutesSince', () => {
  it('redondea hacia abajo', () => {
    expect(minutesSince(0, 14 * 60_000 + 59_000)).toBe(14)
  })
})

describe('sumLines / countUnits / plural', () => {
  const items = [
    { price: 100, qty: 2 },
    { price: 250, qty: 1 },
  ]
  it('suma precio por cantidad', () => {
    expect(sumLines(items)).toBe(450)
  })
  it('cuenta unidades', () => {
    expect(countUnits(items)).toBe(3)
  })
  it('pluraliza', () => {
    expect(plural(1, 'ítem', 'ítems')).toBe('ítem')
    expect(plural(2, 'ítem', 'ítems')).toBe('ítems')
  })
})
