import { expect, test } from 'vitest'
import { quickSort } from './quickSort'
import { createQuickSortTrace } from './quickSortTrace'
import { quickSortCode } from './quickSortCode'
import { barStates, quickMarkers } from './sortingPresentation'

const examples = [[5, 1, 4, 2, 8], [4, 1, 3, 2], [], [7], [0], [1, 2, 3, 4],
  [5, 4, 3, 2, 1], [3, 1, 3, 1, 3], [-4, 0, -9, 2, -4], [2, 2, 2]]

test.each(examples.map((input) => [input]))('sorts %j with accurate partition states and no input mutation', (input) => {
  const frozen = Object.freeze([...input])
  const expected = [...input].sort((a, b) => a - b)
  expect(quickSort(frozen)).toEqual(expected)
  expect(frozen).toEqual(input)
  const trace = createQuickSortTrace(frozen)
  expect(trace).toEqual(createQuickSortTrace(frozen))
  expect(trace.at(-1)?.kind).toBe('complete')
  expect(trace.at(-1)?.values).toEqual(expected)
  expect(trace.at(-1)?.finalIndices).toEqual(input.map((_, index) => index))
  const stack: string[] = []
  const entered: string[] = []
  for (const [position, step] of trace.entries()) {
    expect([...step.values].sort((a, b) => a - b)).toEqual(expected)
    expect(step.originalIndices.map((id) => input[id])).toEqual(step.values)
    expect([...step.originalIndices].sort((a, b) => a - b)).toEqual(input.map((_, index) => index))
    if (step.kind === 'enter') { stack.push(step.callId); entered.push(step.callId) }
    expect(step.stack).toEqual(stack)
    expect(step.calls.map((call) => call.id)).toEqual(entered)
    if (!['start', 'complete'].includes(step.kind)) expect(stack.at(-1)).toBe(step.callId)
    if (step.kind === 'return') stack.pop()
    expect(quickSortCode.filter((line) => line.id === step.lineId)).toHaveLength(1)
    expect(step.explanation).not.toMatch(/undefined|NaN/)
    for (const index of step.finalIndices) expect(step.values[index]).toBe(expected[index])
    const states = barStates(step)
    states.forEach((state, index) => {
      if (state === 'Sorted' || state === 'Pivot placed') expect(step.finalIndices).toContain(index)
      if (state === '≤ pivot') expect(step.values[index]).toBeLessThanOrEqual(step.pivotValue!)
      if (state === '> pivot') expect(step.values[index]).toBeGreaterThan(step.pivotValue!)
    })
    if (step.kind === 'pivot') {
      expect(step.pivotIndex).toBe(step.high)
      expect(step.pivotValue).toBe(step.values[step.high])
    }
    if (step.kind === 'initialize') expect(step.i).toBe(step.low - 1)
    if (step.kind === 'scan' || step.kind === 'compare') {
      expect(step.j).toBeGreaterThanOrEqual(step.low)
      expect(step.j).toBeLessThan(step.high)
      expect(step.values.slice(step.low, step.i! + 1).every((value) => value <= step.pivotValue!)).toBe(true)
      expect(step.values.slice(step.i! + 1, step.j!).every((value) => value > step.pivotValue!)).toBe(true)
    }
    if (['swap', 'skip-swap', 'keep'].includes(step.kind)) {
      expect(step.values.slice(step.low, step.i! + 1).every((value) => value <= step.pivotValue!)).toBe(true)
      expect(step.values.slice(step.i! + 1, step.j! + 1).every((value) => value > step.pivotValue!)).toBe(true)
    }
    if (step.kind === 'pivot-fixed') {
      const pivot = step.pivotTarget!
      expect(pivot).toBe(step.i! + 1)
      expect(step.pivotIndex).toBe(pivot)
      expect(step.values[pivot]).toBe(step.pivotValue)
      expect(step.values.slice(step.low, pivot).every((value) => value <= step.pivotValue!)).toBe(true)
      expect(step.values.slice(pivot + 1, step.high + 1).every((value) => value > step.pivotValue!)).toBe(true)
    }
    if (step.kind === 'call-left' || step.kind === 'call-right') {
      const next = trace[position + 1]
      expect(next.kind).toBe('enter')
      expect(next.parentId).toBe(step.callId)
      expect(next.depth).toBe(step.depth + 1)
      expect([next.low, next.high]).toEqual(step.kind === 'call-left'
        ? [step.low, step.pivotTarget! - 1] : [step.pivotTarget! + 1, step.high])
    }
    if (step.kind === 'return-left' || step.kind === 'return-right') {
      expect(trace[position - 1].kind).toBe('return')
      expect(trace[position - 1].parentId).toBe(step.callId)
    }
    if (step.kind === 'return') {
      const range = step.values.slice(step.low, step.high + 1)
      expect(range).toEqual([...range].sort((a, b) => a - b))
      expect(step.calls.find((call) => call.id === step.callId)?.result).toEqual(range)
    }
    if (position === 0) continue
    const before = trace[position - 1]
    expect(step.values).not.toBe(before.values)
    expect(step.calls).not.toBe(before.calls)
    expect(step.comparisons - before.comparisons).toBe(step.kind === 'compare' ? 1 : 0)
    expect(step.swaps - before.swaps).toBe(step.swapIndices === null ? 0 : 1)
    if (step.kind === 'boundary') {
      expect(step.i).toBe(before.i! + 1)
      expect(before.values[step.j!]).toBeLessThanOrEqual(step.pivotValue!)
      expect(states[step.i!]).toBe('Boundary')
      expect(quickMarkers(step)[step.i!]).toContain('i')
    }
    if (step.swapIndices !== null) {
      const [left, right] = step.swapIndices
      expect(left).not.toBe(right)
      expect(before.finalIndices).not.toContain(left)
      expect(before.finalIndices).not.toContain(right)
      const swapped = [...before.values]
      ;[swapped[left], swapped[right]] = [swapped[right], swapped[left]]
      expect(step.values).toEqual(swapped)
    } else expect(step.values).toEqual(before.values)
    const added = step.finalIndices.filter((index) => !before.finalIndices.includes(index))
    expect(added).toEqual(step.kind === 'pivot-fixed' ? [step.pivotTarget]
      : step.kind === 'base' && step.low === step.high ? [step.low] : [])
  }
})

test('a pending boundary is not mislabeled as already ≤ pivot, and only the pivot becomes final', () => {
  const trace = createQuickSortTrace([4, 1, 3, 2])
  const pending = trace.find((step) => step.kind === 'boundary')!
  expect(pending.values).toEqual([4, 1, 3, 2])
  expect(pending.i).toBe(0)
  expect(pending.j).toBe(1)
  expect(barStates(pending)).toEqual(['Boundary', 'Scan', 'Unseen', 'Pivot'])
  const swapped = trace[trace.indexOf(pending) + 1]
  expect(swapped.kind).toBe('swap')
  expect(swapped.values).toEqual([1, 4, 3, 2])
  const placed = trace.find((step) => step.kind === 'pivot-fixed')!
  expect(placed.values).toEqual([1, 2, 3, 4])
  expect(placed.finalIndices).toEqual([1])
  expect(barStates(placed)).toEqual(['≤ pivot', 'Pivot placed', '> pivot', '> pivot'])
})

test('calls run left first, including explicit empty and single-element base cases', () => {
  const trace = createQuickSortTrace([4, 1, 3, 2])
  expect(trace.filter((step) => step.kind === 'enter').map((step) => [step.low, step.high])).toEqual([
    [0, 3], [0, 0], [2, 3], [2, 2], [4, 3],
  ])
  expect(trace.filter((step) => step.kind === 'return').map((step) => [step.low, step.high])).toEqual([
    [0, 0], [2, 2], [4, 3], [2, 3], [0, 3],
  ])
  expect(trace.filter((step) => step.kind === 'return' && step.low >= step.high).every((step) => step.lineId === 'base')).toBe(true)
})

test('sorted, reverse-sorted, and all-equal input incur quadratic comparisons with last-element pivots', () => {
  for (const input of [[1, 2, 3, 4, 5], [5, 4, 3, 2, 1], [2, 2, 2, 2, 2]]) {
    const trace = createQuickSortTrace(input)
    expect(trace.at(-1)?.comparisons).toBe(10)
    expect(Math.max(...trace.map((step) => step.depth))).toBe(4)
  }
  const sorted = createQuickSortTrace([1, 2, 3])
  expect(sorted.at(-1)?.swaps).toBe(0)
  expect(sorted.filter((step) => step.kind === 'skip-swap')).toHaveLength(3)
  expect(sorted.filter((step) => step.kind === 'pivot-stay')).toHaveLength(2)
})

test('standard distant swaps can reverse equal elements, so Quick Sort does not claim stability', () => {
  const final = createQuickSortTrace([2, 2, 1]).at(-1)!
  expect(final.values).toEqual([1, 2, 2])
  expect(final.originalIndices).toEqual([2, 1, 0])
})

test('later input edits cannot change earlier snapshots', () => {
  const input = [3, 1, 2]
  const trace = createQuickSortTrace(input)
  input[0] = 99
  expect(trace[0].values).toEqual([3, 1, 2])
  expect(trace.at(-1)?.calls[0].input).toEqual([3, 1, 2])
})

test.each([NaN, Infinity, -Infinity])('rejects non-finite input %s', (value) => {
  expect(() => createQuickSortTrace([value])).toThrow(RangeError)
})
