import { describe, expect, it } from 'vitest'
import { shouldAutoReset } from './shouldAutoReset'

describe('shouldAutoReset', () => {
  const now = 1_700_000_000_000

  it('false para un restaurante recién creado/reseteado', () => {
    expect(shouldAutoReset(new Date(now).toISOString(), now)).toBe(false)
    expect(shouldAutoReset(new Date(now - 30 * 60_000).toISOString(), now)).toBe(false)
  })

  it('true cuando pasaron 65 minutos o más', () => {
    expect(shouldAutoReset(new Date(now - 65 * 60_000).toISOString(), now)).toBe(true)
    expect(shouldAutoReset(new Date(now - 3 * 3_600_000).toISOString(), now)).toBe(true)
  })

  it('el límite es justo en 65 minutos, no antes', () => {
    expect(shouldAutoReset(new Date(now - (65 * 60_000 - 1000)).toISOString(), now)).toBe(false)
  })
})
