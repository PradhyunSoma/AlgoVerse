import { expect, test } from 'vitest'
import { mergeSort } from './mergeSort'
import { mergeSortCode } from './mergeSortCode'
import { createMergeSortTrace } from './mergeSortTrace'
import { barStates } from './sortingPresentation'

const examples = [[5, 1, 4, 2, 8], [], [7], [1, 2, 3, 4], [5, 4, 3, 2, 1],
  [3, 1, 3, 1, 3], [-4, 0, -9, 2, -4], [0, 0, 0]]

test.each(examples.map((input) => [input]))('sorts %j stably without mutating input, with accurate independent snapshots', (input) => {
  const frozen = Object.freeze([...input])
  const expected = [...input].sort((a, b) => a - b)
  expect(mergeSort(frozen)).toEqual(expected)
  const trace = createMergeSortTrace(frozen)
  expect(frozen).toEqual(input)
  expect(trace).toEqual(createMergeSortTrace(frozen))
  expect(trace.at(-1)?.values).toEqual(expected)
  expect(trace.at(-1)?.kind).toBe('complete')
  expect(trace.at(-1)?.originalIndices).toEqual(input.map((value, id) => ({ value, id }))
    .sort((a, b) => a.value - b.value || a.id - b.id).map(({ id }) => id))

  const stack: string[] = []
  const entered: string[] = []
  for (const [position, step] of trace.entries()) {
    if (step.kind === 'enter') { stack.push(step.nodeId); entered.push(step.nodeId) }
    expect(step.stack).toEqual(stack)
    expect(step.nodes.map((node) => node.id)).toEqual(entered)
    if (!['start', 'complete'].includes(step.kind)) expect(stack.at(-1)).toBe(step.nodeId)
    if (step.kind === 'return') stack.pop()
    expect(mergeSortCode.filter((line) => line.id === step.lineId)).toHaveLength(1)
    expect(step.explanation).not.toMatch(/undefined|NaN/)
    step.originalIndices.forEach((id, index) => expect(step.values[index]).toBe(input[id]))
    step.bufferOriginalIndices.forEach((id, index) => expect(step.buffer[index]).toBe(id === null ? null : input[id]))
    if (step.kind === 'base') expect(step.hi - step.lo).toBeLessThanOrEqual(1)
    if (step.kind === 'split') expect(step.mid).toBe(step.lo + Math.floor((step.hi - step.lo) / 2))
    if (step.kind === 'call-left' || step.kind === 'call-right') {
      const next = trace[position + 1]
      expect(next.kind).toBe('enter')
      expect(next.parentId).toBe(step.nodeId)
      expect(next.depth).toBe(step.depth + 1)
      expect([next.lo, next.hi]).toEqual(step.kind === 'call-left' ? [step.lo, step.mid] : [step.mid, step.hi])
    }
    if (step.kind === 'return-left' || step.kind === 'return-right') {
      expect(trace[position - 1].kind).toBe('return')
      expect(trace[position - 1].parentId).toBe(step.nodeId)
    }
    if (step.kind === 'merge-start') {
      expect(step.buffer).toEqual(Array(step.hi - step.lo).fill(null))
      const left = step.values.slice(step.lo, step.mid!)
      const right = step.values.slice(step.mid!, step.hi)
      expect(left).toEqual([...left].sort((a, b) => a - b))
      expect(right).toEqual([...right].sort((a, b) => a - b))
      expect(step.sourceValues).toEqual([...left, ...right])
    }
    if (step.kind === 'merge-end' || step.kind === 'return') {
      const range = step.values.slice(step.lo, step.hi)
      expect(range).toEqual([...range].sort((a, b) => a - b))
      expect(step.nodes.find((node) => node.id === step.nodeId)?.result).toEqual(range)
    }
    if (step.sourceValues !== null) {
      const written = step.buffer.filter((value): value is number => value !== null)
      expect(written).toEqual([...step.sourceValues].sort((a, b) => a - b).slice(0, written.length))
      expect(step.buffer.slice(written.length).every((value) => value === null)).toBe(true)
    }
    if (position === 0) continue
    const before = trace[position - 1]
    expect(step.values).not.toBe(before.values)
    expect(step.nodes).not.toBe(before.nodes)
    expect(step.comparisons - before.comparisons).toBe(step.kind === 'compare' ? 1 : 0)
    expect(step.bufferWrites - before.bufferWrites).toBe(step.sourceIndex !== null ? 1 : 0)
    expect(step.arrayWrites - before.arrayWrites).toBe(step.kind === 'copy' ? 1 : 0)
    if (step.kind === 'copy') {
      const destination = step.destinationIndex!
      expect(step.values[destination]).toBe(step.buffer[destination - step.lo])
      step.values.forEach((value, index) => {
        if (index !== destination) expect(value).toBe(before.values[index])
      })
      expect(step.sourceValues).toEqual(before.sourceValues)
      expect(barStates(step)[destination]).toBe('Destination')
      expect(barStates(step).slice(step.lo, step.hi)).not.toContain('Merged')
    } else expect(step.values).toEqual(before.values)
    if (step.kind === 'take-left' || step.kind === 'take-right') {
      expect(before.kind).toBe('compare')
      const takeLeft = before.values[before.leftIndex!] <= before.values[before.rightIndex!]
      expect(step.kind).toBe(takeLeft ? 'take-left' : 'take-right')
      expect(step.sourceIndex).toBe(takeLeft ? before.leftIndex : before.rightIndex)
    }
    if (step.sourceIndex !== null) {
      expect(step.destinationIndex).toBe(before.outputIndex)
      expect(step.buffer[step.destinationIndex! - step.lo]).toBe(step.values[step.sourceIndex])
      expect(barStates(step)[step.sourceIndex]).toBe('Selected')
    }
  }
})

test('recursive calls run depth first, left before right, with postorder merges', () => {
  const trace = createMergeSortTrace([4, 1, 3, 2])
  expect(trace.filter((step) => step.kind === 'enter').map((step) => [step.lo, step.hi])).toEqual([
    [0, 4], [0, 2], [0, 1], [1, 2], [2, 4], [2, 3], [3, 4],
  ])
  expect(trace.filter((step) => step.kind === 'merge-end').map((step) => [step.lo, step.hi, step.values.slice(step.lo, step.hi)])).toEqual([
    [0, 2, [1, 4]], [2, 4, [2, 3]], [0, 4, [1, 2, 3, 4]],
  ])
  expect(trace.filter((step) => step.kind === 'return' && step.hi - step.lo <= 1)
    .every((step) => step.lineId === 'base')).toBe(true)
})

test('buffer filling leaves the working array intact; copy-back exposes honest partial writes', () => {
  const trace = createMergeSortTrace([2, 1])
  const writes = trace.filter((step) => step.sourceIndex !== null)
  expect(writes.map((step) => ({ values: step.values, buffer: step.buffer }))).toEqual([
    { values: [2, 1], buffer: [1, null] }, { values: [2, 1], buffer: [1, 2] },
  ])
  const copies = trace.filter((step) => step.kind === 'copy')
  expect(copies.map((step) => step.values)).toEqual([[1, 1], [1, 2]])
  expect(copies.map((step) => step.buffer)).toEqual([[1, 2], [1, 2]])
  expect(copies.map((step) => step.sourceValues)).toEqual([[2, 1], [2, 1]])
  expect(trace.find((step) => step.kind === 'merge-end')?.nodes[0].status).toBe('Merged')
})

test('ties take the left element first, preserving identities across halves', () => {
  const trace = createMergeSortTrace([2, 1, 2, 1, 2, 1])
  const ties = trace.filter((step) => step.kind === 'compare' && step.values[step.leftIndex!] === step.values[step.rightIndex!])
  expect(ties.length).toBeGreaterThan(0)
  for (const tie of ties) expect(trace[trace.indexOf(tie) + 1].kind).toBe('take-left')
  expect(trace.at(-1)?.originalIndices).toEqual([1, 3, 5, 0, 2, 4])
})

test('snapshots remain independent from later input edits', () => {
  const input = [3, 1, 2]
  const trace = createMergeSortTrace(input)
  input[0] = 99
  expect(trace[0].values).toEqual([3, 1, 2])
  expect(trace.at(-1)?.nodes[0].input).toEqual([3, 1, 2])
})

test.each([NaN, Infinity, -Infinity])('rejects non-finite input %s', (value) => {
  expect(() => createMergeSortTrace([value])).toThrow(RangeError)
})
