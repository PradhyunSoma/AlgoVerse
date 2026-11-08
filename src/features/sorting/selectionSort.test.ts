import { expect, test } from 'vitest'
import { selectionSort } from './selectionSort'
import { selectionSortCode } from './selectionSortCode'
import { createSelectionSortTrace } from './selectionSortTrace'
import { barStates } from './sortingPresentation'

const examples = [
  [5, 1, 4, 2, 8], [1, 2, 3, 4], [5, 4, 3, 2, 1],
  [3, 1, 3, 1], [-4, 0, -9, 2, -4], [], [7], [2, 2, 2],
]

test.each(examples.map((values) => [values]))('sorts %j without changing the input or losing values', (values) => {
  const input = Object.freeze([...values])
  const sorted = [...input].sort((a, b) => a - b)
  expect(selectionSort(input)).toEqual(sorted)
  const trace = createSelectionSortTrace(input)
  expect(trace).toEqual(createSelectionSortTrace(input))
  expect(trace[0].values).toEqual(input)
  const final = trace.at(-1)!
  expect(final.values).toEqual(sorted)
  expect(final.kind).toBe('complete')
  expect(final.sortedCount).toBe(input.length)
  expect(final.comparisons).toBe(input.length * Math.max(0, input.length - 1) / 2)
  expect(input).toEqual(values)

  for (const [index, step] of trace.entries()) {
    expect([...step.values].sort((a, b) => a - b)).toEqual(sorted)
    expect(step.values.slice(0, step.sortedCount)).toEqual(sorted.slice(0, step.sortedCount))
    expect(selectionSortCode.filter((line) => line.id === step.lineId)).toHaveLength(1)
    expect(step.explanation).not.toMatch(/undefined|NaN/)
    if (index > 0) {
      const before = trace[index - 1]
      expect(step.values).not.toBe(before.values)
      expect(step.comparisons - before.comparisons).toBe(step.kind === 'compare' ? 1 : 0)
      expect(step.swaps - before.swaps).toBe(step.kind === 'swap' ? 1 : 0)
      if (step.kind !== 'swap') expect(step.values).toEqual(before.values)
    }
    if (step.kind === 'compare') {
      // Before comparing, the minimum covers only the already scanned prefix.
      const seen = step.values.slice(step.startIndex, step.scanIndex!)
      expect(step.values[step.minimumIndex!]).toBe(Math.min(...seen))
      expect(barStates(step)[step.scanIndex!]).toBe('Scan')
      expect(barStates(step)[step.minimumIndex!]).toBe('Minimum')
    }
    if (step.kind === 'new-minimum' || step.kind === 'keep-minimum') {
      const seen = step.values.slice(step.startIndex, step.scanIndex! + 1)
      expect(step.values[step.minimumIndex!]).toBe(Math.min(...seen))
      if (step.kind === 'new-minimum') {
        expect(step.minimumIndex).toBe(step.scanIndex)
        expect(barStates(step)[step.scanIndex!]).toBe('Scan + min')
      }
    }
    if (step.kind === 'swap') {
      const [left, right] = step.swapIndices!
      expect(left).not.toBe(right)
      expect(step.values[left]).toBe(trace[index - 1].values[right])
      expect(step.values[right]).toBe(trace[index - 1].values[left])
      expect(barStates(step)[left]).toBe('Swap')
      expect(barStates(step)[right]).toBe('Swap')
    }
    if (step.kind === 'pass-end') {
      expect(step.sortedCount).toBe(step.pass)
      expect(barStates(step).slice(0, step.sortedCount)).toEqual(Array(step.sortedCount).fill('Sorted'))
    }
  }
})

test('tracks a known pass through minimum discoveries and the final swap', () => {
  const trace = createSelectionSortTrace([5, 3, 4, 1])
  const firstPass = trace.filter((step) => step.pass === 1)
  expect(firstPass.filter((step) => step.kind === 'new-minimum').map((step) => step.minimumIndex)).toEqual([1, 3])
  expect(firstPass.filter((step) => step.kind === 'compare').map((step) => step.scanIndex)).toEqual([1, 2, 3])
  expect(firstPass.find((step) => step.kind === 'swap')?.values).toEqual([1, 3, 4, 5])
  expect(firstPass.at(-1)?.sortedCount).toBe(1)
})

test('sorted and equal arrays scan every pass without self-swaps or new minima', () => {
  for (const input of [[1, 2, 3, 4], [3, 3, 3, 3]]) {
    const trace = createSelectionSortTrace(input)
    expect(trace.filter((step) => step.kind === 'swap')).toHaveLength(0)
    expect(trace.filter((step) => step.kind === 'no-swap')).toHaveLength(3)
    expect(trace.filter((step) => step.kind === 'new-minimum')).toHaveLength(0)
    expect(trace.at(-1)?.comparisons).toBe(6)
  }
})

test('trace snapshots remain independent of subsequent input edits', () => {
  const input = [3, 2, 1]
  const trace = createSelectionSortTrace(input)
  input[0] = 99
  expect(trace[0].values).toEqual([3, 2, 1])
  expect(trace.at(-1)?.values).toEqual([1, 2, 3])
})

test.each([NaN, Infinity, -Infinity])('rejects non-finite trace input %s', (value) => {
  expect(() => createSelectionSortTrace([value])).toThrow(RangeError)
})
