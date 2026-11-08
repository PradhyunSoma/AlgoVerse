import { mergeSort, type MergeSortEvent, type MergeSortEventKind } from './mergeSort'

export interface MergeNode {
  readonly id: string
  readonly parentId: string | null
  readonly lo: number
  readonly hi: number
  readonly depth: number
  readonly input: readonly number[]
  readonly result: readonly number[] | null
  readonly status: 'Entered' | 'Dividing' | 'Waiting' | 'Merging' | 'Base case' | 'Merged' | 'Returned'
}

export type MergePhase = 'Ready' | 'Divide' | 'Base case' | 'Merge' | 'Copy back' | 'Return' | 'Complete'
export interface MergeSortStep extends MergeSortEvent {
  readonly values: readonly number[]
  readonly originalIndices: readonly number[]
  readonly buffer: readonly (number | null)[]
  readonly bufferOriginalIndices: readonly (number | null)[]
  /** Frozen source values for the active merge, unaffected by partial copy-back. */
  readonly sourceValues: readonly number[] | null
  readonly nodes: readonly MergeNode[]
  readonly stack: readonly string[]
  readonly phase: MergePhase
  readonly lineId: MergeSortEventKind
  readonly explanation: string
  readonly comparisons: number
  readonly bufferWrites: number
  readonly arrayWrites: number
}

export function mergePhase(kind: MergeSortEventKind): MergePhase {
  if (kind === 'start') return 'Ready'
  if (kind === 'complete') return 'Complete'
  if (kind === 'base') return 'Base case'
  if (kind === 'copy') return 'Copy back'
  if (kind === 'return' || kind === 'return-left' || kind === 'return-right') return 'Return'
  if (['merge-start', 'compare', 'take-left', 'take-right', 'drain-left', 'drain-right', 'merge-end'].includes(kind)) return 'Merge'
  return 'Divide'
}

function explain(event: MergeSortEvent, values: readonly number[], buffer: readonly (number | null)[]): string {
  const { kind, lo, hi, mid, leftIndex, rightIndex, sourceIndex, destinationIndex } = event
  const range = `[${lo}, ${hi})`
  switch (kind) {
    case 'start': return 'Begin with the original array. Sort the left half fully, then the right half, then merge their results.'
    case 'enter': return `Enter sort${range} at depth ${event.depth}. This call handles ${hi - lo} values.`
    case 'base-check': return `Does ${range} contain at most one element? ${hi - lo <= 1 ? 'Yes: it is already sorted.' : 'No: this range must be divided.'}`
    case 'base': return `${range} is a base case with ${hi - lo} ${hi - lo === 1 ? 'element' : 'elements'}. No comparison or merge is needed.`
    case 'split': return `Calculate mid = ${mid}. Divide ${range} into [${lo}, ${mid}) and [${mid}, ${hi}). No values move.`
    case 'call-left': return `Call sort[${lo}, ${mid}). The current call waits while its left half is sorted.`
    case 'return-left': return `The left call has returned. [${lo}, ${mid}) is sorted within its range; now prepare to sort the right half.`
    case 'call-right': return `Call sort[${mid}, ${hi}). The left half is complete; the current call waits for the right half.`
    case 'return-right': return `The right call has returned. Both halves of ${range} are sorted and ready to merge.`
    case 'merge-start': return `Start merging [${lo}, ${mid}) and [${mid}, ${hi}) into an empty temporary buffer. The working array stays unchanged until copy-back.`
    case 'compare': return `Compare left ${values[leftIndex!]} with right ${values[rightIndex!]}. Take the smaller value; on equality, take the left first.`
    case 'take-left': return `Select left ${values[sourceIndex!]} at index ${sourceIndex} and write it to buffer index ${destinationIndex}. Advance the left pointer.`
    case 'take-right': return `Select right ${values[sourceIndex!]} at index ${sourceIndex} and write it to buffer index ${destinationIndex}. Advance the right pointer.`
    case 'drain-left': return `The right half is exhausted. Copy remaining left value ${values[sourceIndex!]} to buffer index ${destinationIndex}, without another comparison.`
    case 'drain-right': return `The left half is exhausted. Copy remaining right value ${values[sourceIndex!]} to buffer index ${destinationIndex}, without another comparison.`
    case 'copy': return `Copy buffer[${destinationIndex}] = ${buffer[destinationIndex!]} into working array index ${destinationIndex}. Copy-back is in progress; this range is not marked merged yet.`
    case 'merge-end': return `Merge complete. ${range} is now ordered in the working array. A parent call may merge it into a larger range later.`
    case 'return': return `Return the sorted range ${range}${event.parentId ? ' to the waiting parent call' : ' from the root call'}.`
    case 'complete': return `Finished. All ${values.length} values are sorted, with equal values in their original relative order.`
  }
}

export function createMergeSortTrace(input: readonly number[]): readonly MergeSortStep[] {
  if (input.some((value) => !Number.isFinite(value))) throw new RangeError('Merge Sort requires finite numbers.')
  const steps: MergeSortStep[] = []
  const nodes = new Map<string, MergeNode>()
  const stack: string[] = []
  const identities = input.map((_, index) => index)
  const bufferIds: (number | null)[] = Array(input.length).fill(null)
  let sourceValues: readonly number[] | null = null
  let comparisons = 0
  let bufferWrites = 0
  let arrayWrites = 0
  mergeSort(input, (event, values, buffer) => {
    const { kind, nodeId, lo, hi } = event
    if (kind === 'enter') {
      stack.push(nodeId)
      nodes.set(nodeId, { id: nodeId, parentId: event.parentId, depth: event.depth, lo, hi,
        input: values.slice(lo, hi), result: null, status: 'Entered' })
    }
    const node = nodes.get(nodeId)
    const status = kind === 'split' ? 'Dividing'
      : kind === 'call-left' || kind === 'call-right' ? 'Waiting'
      : kind === 'return-left' || kind === 'return-right' ? 'Dividing'
      : kind === 'merge-start' ? 'Merging' : kind === 'base' ? 'Base case'
      : kind === 'merge-end' ? 'Merged' : kind === 'return' ? 'Returned' : null
    if (node && status) nodes.set(nodeId, { ...node, status,
      result: ['base', 'merge-end', 'return'].includes(kind) ? values.slice(lo, hi) : node.result })
    if (kind === 'merge-start') {
      sourceValues = values.slice(lo, hi)
      bufferIds.fill(null, lo, hi)
    }
    if (kind === 'compare') comparisons += 1
    if (event.sourceIndex !== null && event.destinationIndex !== null) {
      bufferWrites += 1
      bufferIds[event.destinationIndex] = identities[event.sourceIndex]
    }
    if (kind === 'copy') {
      arrayWrites += 1
      identities[event.destinationIndex!] = bufferIds[event.destinationIndex!]!
    }
    const phase = mergePhase(kind)
    const showsBuffer = phase === 'Merge' || phase === 'Copy back'
    steps.push({ ...event, values: [...values], originalIndices: [...identities],
      buffer: showsBuffer ? buffer.slice(lo, hi) : [],
      bufferOriginalIndices: showsBuffer ? bufferIds.slice(lo, hi) : [],
      sourceValues: showsBuffer ? [...sourceValues!] : null,
      nodes: [...nodes.values()].map((entry) => ({ ...entry, input: [...entry.input],
        result: entry.result ? [...entry.result] : null })),
      stack: [...stack], phase, lineId: kind === 'return' && hi - lo <= 1 ? 'base' : kind,
      explanation: explain(event, values, buffer),
      comparisons, bufferWrites, arrayWrites })
    // The return step shows the callee exiting. The next step is back in its caller.
    if (kind === 'return') stack.pop()
  })
  return steps
}
