import { describe, expect, it } from 'vitest'
import { hasNewIds } from './hasNewIds'

describe('hasNewIds', () => {
  it('false si la lista está vacía o no trae ids nuevos', () => {
    expect(hasNewIds(new Set(), [])).toBe(false)
    expect(hasNewIds(new Set(['a', 'b']), [])).toBe(false)
    expect(hasNewIds(new Set(['a', 'b']), ['a'])).toBe(false)
    expect(hasNewIds(new Set(['a', 'b']), ['a', 'b'])).toBe(false)
  })

  it('true si aparece al menos un id que no estaba antes', () => {
    expect(hasNewIds(new Set(), ['a'])).toBe(true)
    expect(hasNewIds(new Set(['a']), ['a', 'b'])).toBe(true)
  })

  it('que desaparezcan ids no cuenta como "nuevo"', () => {
    expect(hasNewIds(new Set(['a', 'b', 'c']), ['a'])).toBe(false)
  })
})
