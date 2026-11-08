import { expect, test } from 'vitest'
import { insertionSort } from './insertionSort'
import { insertionSortCode } from './insertionSortCode'
import { createInsertionSortTrace } from './insertionSortTrace'
import { barStates } from './sortingPresentation'

const examples = [[5, 1, 4, 2, 8], [1, 2, 3, 4], [5, 4, 3, 2, 1],
  [3, 1, 3, 1, 3], [-4, 0, -9, 2, -4], [], [7], [0], [2, 2, 2]]

test.each(examples.map((input) => [input]))('sorts %j with stable, complete snapshots and no input mutation', (input) => {
  const frozen = Object.freeze([...input])
  const expected = [...input].sort((a, b) => a - b)
  expect(insertionSort(frozen)).toEqual(expected)
  expect(frozen).toEqual(input)
  const trace = createInsertionSortTrace(frozen)
  expect(trace).toEqual(createInsertionSortTrace(frozen))
  expect(trace[0].sortedCount).toBe(Math.min(1, input.length))
  expect(trace.at(-1)?.kind).toBe('complete')
  expect(trace.at(-1)?.values).toEqual(expected)
  expect(trace.at(-1)?.key).toBeNull()
  expect(trace.at(-1)?.sortedCount).toBe(input.length)
  const stableOrder = input.map((value, id) => ({ value, id }))
    .sort((a, b) => a.value - b.value || a.id - b.id).map(({ id }) => id)
  expect(trace.at(-1)?.originalIndices).toEqual(stableOrder)

  for (const [position, step] of trace.entries()) {
    const present = step.values.filter((value): value is number => value !== null)
    if (step.key !== null) present.push(step.key)
    expect(present.sort((a, b) => a - b)).toEqual(expected)
    expect(step.values.filter((value) => value === null)).toHaveLength(step.key === null ? 0 : 1)
    const ids = step.originalIndices.filter((id): id is number => id !== null)
    if (step.keyOriginalIndex !== null) ids.push(step.keyOriginalIndex)
    expect(ids.sort((a, b) => a - b)).toEqual(input.map((_, index) => index))
    step.originalIndices.forEach((id, index) => {
      expect(step.values[index]).toBe(id === null ? null : input[id])
    })
    if (step.keyOriginalIndex !== null) expect(step.key).toBe(input[step.keyOriginalIndex])
    expect(insertionSortCode.filter((line) => line.id === step.lineId)).toHaveLength(1)
    expect(step.explanation).not.toMatch(/undefined|NaN/)

    const ordered = step.values.slice(0, step.key === null ? step.sortedCount : step.outerIndex + 1)
      .filter((value): value is number => value !== null)
    expect(ordered).toEqual([...ordered].sort((a, b) => a - b))
    if (position === 0) continue
    const before = trace[position - 1]
    expect(step.values).not.toBe(before.values)
    expect(step.originalIndices).not.toBe(before.originalIndices)
    expect(step.comparisons - before.comparisons).toBe(step.kind === 'compare' ? 1 : 0)
    expect(step.shifts - before.shifts).toBe(step.kind === 'shift' ? 1 : 0)
    if (step.kind === 'key') {
      expect(step.key).toBe(before.values[step.outerIndex])
      expect(step.keyOriginalIndex).toBe(before.originalIndices[step.outerIndex])
      expect(step.vacantIndex).toBe(step.outerIndex)
      expect(step.values[step.outerIndex]).toBeNull()
    } else if (step.kind === 'shift') {
      expect(before.kind).toBe('compare')
      expect(before.values[step.shiftedFrom!]!).toBeGreaterThan(step.key!)
      expect(step.shiftedTo).toBe(step.shiftedFrom! + 1)
      expect(step.shiftedTo).toBe(before.vacantIndex)
      expect(step.values[step.shiftedTo!]).toBe(before.values[step.shiftedFrom!])
      expect(step.values[step.shiftedFrom!]).toBeNull()
      expect(step.key).toBe(before.key)
      expect(barStates(step)[step.shiftedFrom!]).toBe('Vacant')
      expect(barStates(step)[step.shiftedTo!]).toBe('Shift')
    } else if (step.kind === 'insert') {
      expect(step.insertedIndex).toBe(before.vacantIndex)
      expect(step.values[step.insertedIndex!]).toBe(before.key)
      expect(step.key).toBeNull()
      expect(step.vacantIndex).toBeNull()
      expect(step.sortedCount).toBe(step.outerIndex + 1)
      expect(barStates(step)[step.insertedIndex!]).toBe('Key')
    } else {
      expect(step.values).toEqual(before.values)
    }
  }
})

test('a known pass moves the vacancy left while holding exactly one key', () => {
  const trace = createInsertionSortTrace([3, 4, 1])
  const secondPass = trace.filter((step) => step.pass === 2)
  expect(secondPass.filter((step) => ['key', 'shift', 'insert'].includes(step.kind))
    .map((step) => ({ values: step.values, key: step.key, hole: step.vacantIndex }))).toEqual([
    { values: [3, 4, null], key: 1, hole: 2 },
    { values: [3, null, 4], key: 1, hole: 1 },
    { values: [null, 3, 4], key: 1, hole: 0 },
    { values: [1, 3, 4], key: null, hole: null },
  ])
})

test('equal values keep their identities in order and never shift past each other', () => {
  const trace = createInsertionSortTrace([2, 1, 2, 1, 2])
  expect(trace.at(-1)?.originalIndices).toEqual([1, 3, 0, 2, 4])
  const equalStops = trace.filter((step) => step.kind === 'stop' && step.values[step.index!] === step.key)
  expect(equalStops.length).toBeGreaterThan(0)
  for (const step of equalStops) {
    expect(step.originalIndices[step.index!]!).toBeLessThan(step.keyOriginalIndex!)
  }
})

test('sorted input takes linear comparisons and no shifts; reverse input shifts every earlier value', () => {
  const sorted = createInsertionSortTrace([1, 2, 3, 4, 5]).at(-1)!
  expect(sorted.comparisons).toBe(4)
  expect(sorted.shifts).toBe(0)
  const reverse = createInsertionSortTrace([5, 4, 3, 2, 1]).at(-1)!
  expect(reverse.comparisons).toBe(10)
  expect(reverse.shifts).toBe(10)
})

test('snapshots do not retain references to mutable input', () => {
  const input = [2, 1]
  const trace = createInsertionSortTrace(input)
  input[0] = 99
  expect(trace[0].values).toEqual([2, 1])
})

test.each([NaN, Infinity, -Infinity])('rejects non-finite trace input %s', (value) => {
  expect(() => createInsertionSortTrace([value])).toThrow(RangeError)
})
