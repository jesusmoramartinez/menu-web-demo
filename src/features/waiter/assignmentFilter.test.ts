import { describe, expect, it } from 'vitest'
import type { WaiterAssignment } from '@/types/domain'
import { filterByAssignment, hasAssignments } from './assignmentFilter'

const items = [
  { id: 'a', tableId: 't1', sectorId: 's1' },
  { id: 'b', tableId: 't2', sectorId: 's1' },
  { id: 'c', tableId: 't3', sectorId: 's2' },
  { id: 'd', tableId: 't4', sectorId: null },
]

const assignment = (over: Partial<WaiterAssignment>): WaiterAssignment => ({
  id: 'w1',
  staffId: 'staff-1',
  sectorId: null,
  tableId: null,
  ...over,
})

describe('filterByAssignment', () => {
  it('sin asignaciones, ve todo', () => {
    expect(filterByAssignment(items, [], false)).toEqual(items)
  })

  it('showAll ignora las asignaciones', () => {
    expect(filterByAssignment(items, [assignment({ sectorId: 's1' })], true)).toEqual(items)
  })

  it('filtra por sector asignado', () => {
    const r = filterByAssignment(items, [assignment({ sectorId: 's1' })], false)
    expect(r.map((i) => i.id)).toEqual(['a', 'b'])
  })

  it('filtra por mesa puntual asignada', () => {
    const r = filterByAssignment(items, [assignment({ tableId: 't3' })], false)
    expect(r.map((i) => i.id)).toEqual(['c'])
  })

  it('combina varias asignaciones (sector ∪ mesa)', () => {
    const r = filterByAssignment(items, [assignment({ sectorId: 's2' }), assignment({ tableId: 't1' })], false)
    expect(r.map((i) => i.id)).toEqual(['a', 'c'])
  })

  it('una mesa sin sector nunca aparece si sólo hay asignación por sector', () => {
    const r = filterByAssignment(items, [assignment({ sectorId: 's1' })], false)
    expect(r.find((i) => i.id === 'd')).toBeUndefined()
  })
})

describe('hasAssignments', () => {
  it('detecta si hay alguna asignación', () => {
    expect(hasAssignments([])).toBe(false)
    expect(hasAssignments([assignment({ sectorId: 's1' })])).toBe(true)
  })
})
