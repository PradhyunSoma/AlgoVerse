import { bubbleSort, type BubbleSortEvent, type BubbleSortEventKind } from './bubbleSort'

export interface SortingStep extends BubbleSortEvent {
  readonly values: readonly number[]
  readonly lineId: BubbleSortEventKind
  readonly explanation: string
  readonly comparisons: number
  readonly swaps: number
}

function explain(event: BubbleSortEvent, values: readonly number[]): string {
  const { kind, pass, end, index, swappedInPass } = event
  // Only pair-related events carry an index.
  const left = values[index ?? 0]
  const right = values[(index ?? 0) + 1]
  switch (kind) {
    case 'start': return `Start with ${values.length} values. We will sort them from smallest to largest.`
    case 'pass': return `Begin pass ${pass}. Scan the unsorted range from index 0 to ${end}.`
    case 'reset': return 'Set swapped to false. We will remember whether this pass changes the array.'
    case 'pair': return `Move i to ${index}. Select adjacent indices ${index} and ${index! + 1}.`
    case 'compare': return `Compare ${left} and ${right}. Is ${left} greater than ${right}?`
    case 'swap': return `Yes. Swap ${right} and ${left}, moving the larger value ${right} to the right. Set swapped to true.`
    case 'keep': return `No. ${left} is less than or equal to ${right}, so keep this pair in place.`
    case 'pass-end': return `Pass ${pass} is complete. ${values[end]} at index ${end} is in its final position. The sorted portion now starts at index ${end}.`
    case 'check': return swappedInPass
      ? 'This pass made a swap. Continue with the next smaller unsorted range, if any remains.'
      : 'This pass made no swaps. Every adjacent pair is in order, so we can stop early.'
    case 'early-exit': return 'Stop early. A whole pass without swaps proves the remaining range is sorted too.'
    case 'complete': return values.length < 2
      ? 'Already sorted. An array with fewer than two values needs no comparisons.'
      : `Finished. All ${values.length} values are sorted in ascending order.`
  }
}

/** Captures independent snapshots while the algorithm runs on a private copy. */
export function createBubbleSortTrace(input: readonly number[]): readonly SortingStep[] {
  if (input.some((value) => !Number.isFinite(value))) {
    throw new RangeError('Bubble Sort requires finite numbers.')
  }
  const steps: SortingStep[] = []
  let comparisons = 0
  let swaps = 0
  bubbleSort(input, (event, values) => {
    if (event.kind === 'compare') comparisons += 1
    if (event.kind === 'swap') swaps += 1
    steps.push({
      ...event,
      values: [...values],
      lineId: event.kind,
      explanation: explain(event, values),
      comparisons,
      swaps,
    })
  })
  return steps
}
