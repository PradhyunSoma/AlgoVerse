import { algorithms, type Algorithm } from './sortingCatalog'
import type { SortingSnapshot } from './sortingPresentation'

export interface ComparisonRun {
  readonly algorithm: Algorithm
  readonly original: readonly number[]
  readonly trace: readonly SortingSnapshot[]
}
export function createComparisonRuns(selected: readonly Algorithm[], input: readonly number[]): readonly ComparisonRun[] {
  if (selected.length < 2 || selected.length > 3 || new Set(selected).size !== selected.length) {
    throw new Error('Select two or three different sorting algorithms.')
  }
  return selected.map(algorithm => {
    const original = Object.freeze([...input])
    return { algorithm, original, trace: algorithms[algorithm].createTrace(original) }
  })
}

export const comparisonPresets = [
  { label: 'Default example', values: [5, 1, 4, 2, 8] },
  { label: 'Already sorted', values: [1, 2, 4, 5, 8] },
  { label: 'Reverse sorted', values: [8, 5, 4, 2, 1] },
  { label: 'Nearly sorted', values: [1, 2, 5, 4, 8] },
  { label: 'Duplicates', values: [3, -1, 3, 0, -1] },
] as const

export function comparisonInsight(run: ComparisonRun): string {
  const m = run.trace.at(-1)!.metrics
  switch (run.algorithm) {
    case 'bubble': return `This input needed ${m.comparisons} adjacent comparisons and ${m.swaps} swaps. A full no-swap pass allows this version to stop early.`
    case 'selection': return `Scanning every remaining suffix required ${m.comparisons} comparisons, but only ${m.swaps} swaps. Sorted input avoids swaps, not the scan.`
    case 'insertion': return `This input needed ${m.shifts} shifts and ${m.arrayWrites} array writes, including key placements. Few out-of-order pairs mean fewer shifts; shifts are not swaps.`
    case 'merge': return `Merging wrote ${m.bufferWrites} values into temporary storage and ${m.arrayWrites} back to the main array. Already sorted halves are still merged.`
    case 'quick': return `Last-element pivots required ${m.comparisons} comparisons and ${m.swaps} real swaps here. Sorted, reverse-sorted, and all-equal inputs can create highly uneven partitions; self-swaps are skipped.`
  }
}
