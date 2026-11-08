import { selectionSort, type SelectionSortEvent, type SelectionSortEventKind } from './selectionSort'

export interface SelectionSortStep extends SelectionSortEvent {
  readonly values: readonly number[]
  readonly lineId: SelectionSortEventKind
  readonly explanation: string
  readonly comparisons: number
  readonly swaps: number
}

function explain(event: SelectionSortEvent, values: readonly number[]): string {
  const { kind, pass, startIndex, scanIndex, minimumIndex } = event
  const minimum = minimumIndex === null ? undefined : values[minimumIndex]
  const scanning = scanIndex === null ? undefined : values[scanIndex]
  switch (kind) {
    case 'start': return `Start with ${values.length} values. Select the smallest remaining value on each pass.`
    case 'pass': return `Begin pass ${pass}. Find the minimum from index ${startIndex} to ${values.length - 1}. Indices before ${startIndex} are sorted.`
    case 'minimum': return `Start with ${minimum} at index ${minimumIndex} as the current minimum.`
    case 'scan': return `Scan index ${scanIndex}, holding ${scanning}. The current minimum is ${minimum} at index ${minimumIndex}.`
    case 'compare': return `Compare ${scanning} with the current minimum ${minimum}. Is ${scanning} smaller?`
    case 'new-minimum': return `Yes. ${minimum} is the new minimum. Remember index ${minimumIndex}; no values move yet.`
    case 'keep-minimum': return `No. ${scanning} is greater than or equal to ${minimum}. Keep index ${minimumIndex} as the minimum.`
    case 'check-swap': return `The scan is complete. Is minimum index ${minimumIndex} different from pass position ${startIndex}?`
    case 'swap': return `Swap indices ${event.swapIndices![0]} and ${event.swapIndices![1]}. The minimum ${values[startIndex]} now occupies index ${startIndex}.`
    case 'no-swap': return `The minimum is already at index ${startIndex}. Skip the swap; swapping a value with itself would do nothing.`
    case 'pass-end': return `Pass ${pass} is complete. ${values[startIndex]} is in its final position. The first ${event.sortedCount} values are sorted.`
    case 'complete': return values.length < 2
      ? 'Already sorted. An array with fewer than two values needs no comparisons.'
      : `Finished. All ${values.length} values are sorted. The last remaining value is also in its final position.`
  }
}

export function createSelectionSortTrace(input: readonly number[]): readonly SelectionSortStep[] {
  if (input.some((value) => !Number.isFinite(value))) {
    throw new RangeError('Selection Sort requires finite numbers.')
  }
  const steps: SelectionSortStep[] = []
  let comparisons = 0
  let swaps = 0
  selectionSort(input, (event, values) => {
    if (event.kind === 'compare') comparisons += 1
    if (event.kind === 'swap') swaps += 1
    steps.push({ ...event, values: [...values], lineId: event.kind,
      explanation: explain(event, values), comparisons, swaps })
  })
  return steps
}
