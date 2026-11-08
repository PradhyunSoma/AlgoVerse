import { expect, test } from 'vitest'
import { algorithms, type Algorithm } from './sortingCatalog'
import { createComparisonRuns } from './comparison'
import { zeroMetrics } from './operationMetrics'

const ids = Object.keys(algorithms) as Algorithm[]
// Hand-worked totals: comparisons, real swaps, main writes, buffer value writes, shifts.
const examples = [
  { input: [2, 1], counts: [[1,1,2,0,0],[1,1,2,0,0],[1,0,2,0,1],[1,0,2,2,0],[1,1,2,0,0]] },
  { input: [1, 2, 3], counts: [[2,0,0,0,0],[3,0,0,0,0],[2,0,2,0,0],[2,0,5,5,0],[3,0,0,0,0]] },
  { input: [3, 2, 1], counts: [[3,3,6,0,0],[3,1,2,0,0],[3,0,5,0,3],[3,0,5,5,0],[3,1,2,0,0]] },
  { input: [2, 2, 1], counts: [[3,2,4,0,0],[3,1,2,0,0],[3,0,4,0,2],[3,0,5,5,0],[3,1,2,0,0]] },
  { input: [-1, 0, -1], counts: [[3,1,2,0,0],[3,1,2,0,0],[3,0,3,0,1],[2,0,5,5,0],[2,1,2,0,0]] },
  { input: [3, 1, 2], counts: [[3,2,4,0,0],[3,2,4,0,0],[3,0,4,0,2],[3,0,5,5,0],[2,2,4,0,0]] },
]
for (const [slot, algorithm] of ids.entries()) {
  test.each(examples)(`${algorithm}: independent totals for $input`, ({ input, counts }) => {
    const original = Object.freeze([...input]), trace = algorithms[algorithm].createTrace(original)
    const final = trace.at(-1)!, m = final.metrics
    expect([m.comparisons,m.swaps,m.arrayWrites,m.bufferWrites,m.shifts]).toEqual(counts[slot])
    expect(final.values).toEqual([...input].sort((a,b) => a-b))
    expect(original).toEqual(input)
    expect(trace).toEqual(algorithms[algorithm].createTrace(original))
    expect(trace[0].metrics).toEqual(zeroMetrics)
    for (let i = 1; i < trace.length; i++) {
      expect(Object.isFrozen(trace[i].metrics)).toBe(true)
      for (const key of Object.keys(zeroMetrics) as (keyof typeof zeroMetrics)[]) expect(trace[i].metrics[key]).toBeGreaterThanOrEqual(trace[i-1].metrics[key])
      expect(trace[i].comparisons).toBe(trace[i].metrics.comparisons)
    }
  })
  test.each([{ input: [] }, { input: [7] }])(`${algorithm}: empty/singleton performs no data operations ($input)`, ({ input }) => {
    const trace = algorithms[algorithm].createTrace(input)
    expect(trace.at(-1)!.metrics).toEqual(zeroMetrics)
    expect(trace.at(-1)!.values).toEqual(input)
  })
}

test('intermediate counters reflect assignments, not teaching events or final totals', () => {
  const insertion = algorithms.insertion.createTrace([2, 1])
  expect(insertion.find(s => s.kind === 'key')!.metrics).toEqual(zeroMetrics)
  expect(insertion.find(s => s.kind === 'shift')!.metrics).toEqual({ comparisons: 1, swaps: 0, arrayWrites: 1, bufferWrites: 0, shifts: 1 })
  expect(insertion.find(s => s.kind === 'insert')!.metrics.arrayWrites).toBe(2)
  const merge = algorithms.merge.createTrace([2, 1])
  expect(merge.find(s => s.kind === 'merge-start')!.metrics).toEqual(zeroMetrics)
  expect(merge.find(s => s.kind === 'take-right')!.metrics).toEqual({ comparisons: 1, swaps: 0, arrayWrites: 0, bufferWrites: 1, shifts: 0 })
  expect(merge.find(s => s.kind === 'copy')!.metrics).toEqual({ comparisons: 1, swaps: 0, arrayWrites: 1, bufferWrites: 2, shifts: 0 })
  const quick = algorithms.quick.createTrace([1, 2, 3])
  for (const s of quick.filter(s => s.kind === 'skip-swap' || s.kind === 'pivot-stay')) expect(s.metrics.swaps).toBe(0)
  expect(quick.at(-1)!.metrics.arrayWrites).toBe(0)
})

test('two and three runs use independent copies of the identical original', () => {
  const original = Object.freeze([5, 1, 4, 2, 8])
  for (const selected of [['bubble', 'quick'], ['insertion', 'merge', 'selection']] as const) {
    const runs = createComparisonRuns(selected, original)
    for (const run of runs) {
      expect(run.original).toEqual(original)
      expect(run.original).not.toBe(original)
      expect(run.trace[0].values).toEqual(original)
      expect(run.trace.at(-1)!.values).toEqual([1,2,4,5,8])
    }
    expect(runs[0].original).not.toBe(runs[1].original)
  }
  expect(original).toEqual([5,1,4,2,8])
  expect(() => createComparisonRuns(['bubble', 'bubble'], original)).toThrow('different')
  expect(() => createComparisonRuns(['bubble'], original)).toThrow('two or three')
  expect(() => createComparisonRuns(['bubble','quick','merge','insertion'], original)).toThrow('two or three')
})
