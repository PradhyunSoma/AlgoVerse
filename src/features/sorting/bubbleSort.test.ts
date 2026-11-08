import { describe, expect, test } from 'vitest'
import { bubbleSort } from './bubbleSort'
import { bubbleSortCode } from './bubbleSortCode'
import { createBubbleSortTrace } from './bubbleSortTrace'

const cases = [
  { name: 'sample', input: [5, 1, 4, 2, 8], expected: [1, 2, 4, 5, 8] },
  { name: 'already sorted', input: [1, 2, 3, 4], expected: [1, 2, 3, 4] },
  { name: 'reverse sorted', input: [5, 4, 3, 2, 1], expected: [1, 2, 3, 4, 5] },
  { name: 'duplicates', input: [3, 1, 3, 1, 2], expected: [1, 1, 2, 3, 3] },
  { name: 'equal values', input: [2, 2, 2], expected: [2, 2, 2] },
  { name: 'negative values', input: [-2, 0, -5, 3, -2], expected: [-5, -2, -2, 0, 3] },
  { name: 'empty', input: [], expected: [] },
  { name: 'single element', input: [7], expected: [7] },
]

describe.each(cases)('$name array', ({ input, expected }) => {
  test('sorts a private copy and preserves the input multiset', () => {
    const original = Object.freeze([...input])
    const values = bubbleSort(original)
    expect(original).toEqual(input)
    expect(values).toEqual(expected)
    expect([...values].sort((a, b) => a - b)).toEqual([...input].sort((a, b) => a - b))
  })

  test('produces a deterministic trace with independent snapshots and valid sorted regions', () => {
    const source = Object.freeze([...input])
    const trace = createBubbleSortTrace(source)
    expect(trace).toEqual(createBubbleSortTrace(source))
    expect(source).toEqual(input)
    expect(trace[0].values).toEqual(input)
    expect(trace.at(-1)).toMatchObject({ kind: 'complete', values: expected, sortedFrom: 0, index: null })
    expect(new Set(trace.map((step) => step.values)).size).toBe(trace.length)
    for (const [index, step] of trace.entries()) {
      expect([...step.values].sort((a, b) => a - b)).toEqual(expected)
      expect(step.values.slice(step.sortedFrom)).toEqual(expected.slice(step.sortedFrom))
      expect(bubbleSortCode.some((line) => line.id === step.lineId)).toBe(true)
      if (step.index !== null) {
        expect(step.index).toBeGreaterThanOrEqual(0)
        expect(step.index + 1).toBeLessThan(step.sortedFrom)
      }
      if (index === 0) continue
      const previous = trace[index - 1]
      expect(step.sortedFrom).toBeLessThanOrEqual(previous.sortedFrom)
      const expectedValues = [...previous.values]
      if (step.kind === 'swap') {
        const left = step.index!
        expect(previous.kind).toBe('compare')
        expect(expectedValues[left]).toBeGreaterThan(expectedValues[left + 1])
        const temporary = expectedValues[left]
        expectedValues[left] = expectedValues[left + 1]
        expectedValues[left + 1] = temporary
      }
      expect(step.values).toEqual(expectedValues)
    }
  })
})

test('records comparisons before swaps and seals the sorted suffix at each pass', () => {
  const trace = createBubbleSortTrace([5, 1, 4, 2, 8])
  expect(trace.slice(0, 6).map((step) => step.kind)).toEqual(['start', 'pass', 'reset', 'pair', 'compare', 'swap'])
  expect(trace[4]).toMatchObject({ values: [5, 1, 4, 2, 8], index: 0, comparisons: 1, swaps: 0 })
  expect(trace[5]).toMatchObject({ values: [1, 5, 4, 2, 8], index: 0, comparisons: 1, swaps: 1 })
  expect(trace.filter((step) => step.kind === 'pass-end').map((step) => step.sortedFrom)).toEqual([4, 3, 2])
  expect(trace.at(-1)).toMatchObject({ comparisons: 9, swaps: 4 })
})

test('stops after one swap-free pass, including arrays with equal values', () => {
  for (const values of [[1, 2, 3, 4], [2, 2, 2, 2]]) {
    const trace = createBubbleSortTrace(values)
    expect(trace.at(-1)).toMatchObject({ pass: 1, comparisons: 3, swaps: 0 })
    expect(trace.filter((step) => step.kind === 'early-exit')).toHaveLength(1)
  }
})

test('does not compare empty or single-element arrays', () => {
  for (const values of [[], [1]]) {
    expect(createBubbleSortTrace(values).map((step) => step.kind)).toEqual(['start', 'complete'])
  }
})

test('rejects nonfinite trace inputs', () => {
  for (const value of [NaN, Infinity, -Infinity]) {
    expect(() => createBubbleSortTrace([value])).toThrow('finite numbers')
  }
})
