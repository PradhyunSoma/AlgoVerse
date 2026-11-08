import { recordOperation, zeroMetrics, type OperationMetrics } from './operationMetrics'
import { quickSort, type QuickSortEvent, type QuickSortEventKind } from './quickSort'

export interface QuickCall {
  readonly id: string
  readonly parentId: string | null
  readonly depth: number
  readonly low: number
  readonly high: number
  readonly input: readonly number[]
  readonly result: readonly number[] | null
  readonly finalPivot: number | null
  readonly status: 'Entered' | 'Partitioning' | 'Partitioned' | 'Waiting left' | 'Waiting right' | 'Base case' | 'Returned'
}
export interface QuickSortStep extends QuickSortEvent {
  readonly values: readonly number[]
  readonly originalIndices: readonly number[]
  readonly finalIndices: readonly number[]
  readonly calls: readonly QuickCall[]
  readonly stack: readonly string[]
  readonly lastReturned: string | null
  readonly phase: 'Ready' | 'Recursion' | 'Base case' | 'Partition' | 'Pivot placement' | 'Return' | 'Complete'
  readonly lineId: QuickSortEventKind
  readonly explanation: string
  readonly metrics: OperationMetrics
  readonly comparisons: number
  readonly swaps: number
}

function phase(kind: QuickSortEventKind): QuickSortStep['phase'] {
  if (kind === 'start') return 'Ready'
  if (kind === 'complete') return 'Complete'
  if (kind === 'base') return 'Base case'
  if (['return', 'return-left', 'return-right'].includes(kind)) return 'Return'
  if (['enter', 'base-check', 'call-left', 'call-right'].includes(kind)) return 'Recursion'
  if (['pivot-target', 'pivot-swap', 'pivot-stay', 'pivot-fixed'].includes(kind)) return 'Pivot placement'
  return 'Partition'
}

function explain(event: QuickSortEvent, values: readonly number[]): string {
  const { kind, low, high, i, j, pivotValue, pivotTarget } = event
  const range = `[${low}, ${high}]`
  switch (kind) {
    case 'start': return 'Begin Quick Sort. In each nontrivial range, choose its last value as the pivot and partition before recursing.'
    case 'enter': return `Enter quickSort${range} at depth ${event.depth}${low > high ? '. This range is empty.' : '.'}`
    case 'base-check': return `Is low (${low}) greater than or equal to high (${high})? ${low >= high ? 'Yes: this is a base case.' : 'No: partition this range.'}`
    case 'base': return low > high ? 'Empty range: there is nothing to sort. Return to the caller.'
      : `Only index ${low} remains in this partition. Its value ${values[low]} is now guaranteed final.`
    case 'pivot': return `Select the last element, ${pivotValue} at index ${high}, as the pivot. It stays there while j scans the other elements.`
    case 'initialize': return `Set i = low − 1 = ${i}. No values have joined the ≤ pivot region yet. The next accepted value will go at i + 1.`
    case 'scan': return `Move j to index ${j}, holding ${values[j!]}. The pivot remains ${pivotValue} at index ${high}.`
    case 'compare': return `Is ${values[j!]} at j = ${j} less than or equal to pivot ${pivotValue}?`
    case 'boundary': return `Yes. Move i to ${i}, reserving a place for ${values[j!]}. ${i === j ? 'It is already at that index; no self-swap is needed.' : 'The swap is pending: this new boundary position is not in the completed ≤ pivot region yet.'}`
    case 'swap': return `Swap indices ${i} and ${j}. Value ${values[i!]} joins the ≤ pivot region through index ${i}. These values are partitioned, not necessarily sorted.`
    case 'skip-swap': return `i and j are both ${i}. Skip swapping an element with itself. The ≤ pivot region now ends at ${i}.`
    case 'keep': return `${values[j!]} is greater than pivot ${pivotValue}. Leave it in the processed > pivot region and keep i = ${i}.`
    case 'scan-end': return `Scanning is complete. ${i! < low ? 'The ≤ pivot region is empty' : `Indices ${low} through ${i} contain values ≤ ${pivotValue}`}; the remaining scanned values are greater. Neither side is necessarily sorted.`
    case 'pivot-target': return `The pivot belongs at p = i + 1 = ${pivotTarget}, between the ≤ pivot and > pivot regions.`
    case 'pivot-swap': return `Swap the pivot from index ${high} into index ${pivotTarget}. The displaced value moves to index ${high}.`
    case 'pivot-stay': return `The pivot is already at p = high = ${high}. Skip the self-swap.`
    case 'pivot-fixed': return `Pivot ${pivotValue} is final at index ${pivotTarget}. Only that position is settled by this partition; the two sides still need recursive sorting.`
    case 'call-left': return `Call quickSort[${low}, ${pivotTarget! - 1}] on the left partition. Exclude the final pivot at ${pivotTarget}.`
    case 'return-left': return 'The left recursive call has returned. Continue with the right partition.'
    case 'call-right': return `Call quickSort[${pivotTarget! + 1}, ${high}] on the right partition. Exclude the final pivot at ${pivotTarget}.`
    case 'return-right': return `The right recursive call has returned. Both sides and the pivot in ${range} are now sorted.`
    case 'return': return `Return from quickSort${range}${event.parentId ? ' to the waiting parent' : ' to finish the root call'}.`
    case 'complete': return `Finished. All ${values.length} values are sorted in ascending order. Quick Sort does not guarantee the original order of equal-valued elements.`
  }
}

export function createQuickSortTrace(input: readonly number[]): readonly QuickSortStep[] {
  if (input.some((value) => !Number.isFinite(value))) throw new RangeError('Quick Sort requires finite numbers.')
  const steps: QuickSortStep[] = []
  const calls = new Map<string, QuickCall>()
  const stack: string[] = []
  const finalIndices = new Set<number>()
  const identities = input.map((_, index) => index)
  let lastReturned: string | null = null
  let metrics = zeroMetrics
  quickSort(input, (event, values) => {
    metrics = recordOperation(metrics, 'quick', event.kind)
    const { kind, callId, low, high } = event
    if (kind === 'enter') {
      stack.push(callId)
      calls.set(callId, { id: callId, parentId: event.parentId, depth: event.depth, low, high,
        input: values.slice(low, high + 1), result: null, finalPivot: null, status: 'Entered' })
    }
    const call = calls.get(callId)
    const status = kind === 'pivot' ? 'Partitioning' : kind === 'pivot-fixed' ? 'Partitioned'
      : kind === 'call-left' ? 'Waiting left' : kind === 'call-right' ? 'Waiting right'
      : kind === 'return-left' || kind === 'return-right' ? 'Partitioned'
      : kind === 'base' ? 'Base case' : kind === 'return' ? 'Returned' : null
    if (call && status) calls.set(callId, { ...call, status,
      finalPivot: kind === 'pivot-fixed' ? event.pivotTarget : call.finalPivot,
      result: kind === 'base' || kind === 'return' ? values.slice(low, high + 1) : call.result })
    if (event.swapIndices !== null) {
      const [left, right] = event.swapIndices
      ;[identities[left], identities[right]] = [identities[right], identities[left]]
    }
    if (kind === 'pivot-fixed') finalIndices.add(event.pivotTarget!)
    if (kind === 'base' && low === high) finalIndices.add(low)
    if (kind === 'return') lastReturned = callId
    steps.push({ ...event, values: [...values], originalIndices: [...identities],
      finalIndices: [...finalIndices].sort((a, b) => a - b),
      calls: [...calls.values()].map((entry) => ({ ...entry, input: [...entry.input], result: entry.result === null ? null : [...entry.result] })),
      stack: [...stack], lastReturned, phase: phase(kind),
      lineId: kind === 'return' && low >= high ? 'base' : kind,
      explanation: explain(event, values), metrics, comparisons: metrics.comparisons, swaps: metrics.swaps })
    if (kind === 'return') stack.pop()
  })
  return steps
}
