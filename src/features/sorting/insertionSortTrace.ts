import { insertionSort, type InsertionSortEvent, type InsertionSortEventKind } from './insertionSort'

export interface InsertionSortStep extends InsertionSortEvent {
  /** null is a vacant slot, not a numeric zero or an additional element. */
  readonly values: readonly (number | null)[]
  readonly originalIndices: readonly (number | null)[]
  readonly keyOriginalIndex: number | null
  readonly lineId: InsertionSortEventKind
  readonly explanation: string
  readonly comparisons: number
  readonly shifts: number
}

function explain(event: InsertionSortEvent, values: readonly number[]): string {
  const { kind, pass, outerIndex, index, key, vacantIndex, insertedIndex, shiftedFrom, shiftedTo } = event
  switch (kind) {
    case 'start': return values.length === 0
      ? 'Start with an empty array. There is nothing to insert.'
      : 'The first element is already a sorted portion of length one. Insert each following key into that portion.'
    case 'pass': return `Begin pass ${pass}. Insert the value at index ${outerIndex} into the ordered portion to its left.`
    case 'key': return `Hold ${key} as the key outside the array. Index ${vacantIndex} is now vacant. Start looking left at index ${index}.`
    case 'check': return index! >= 0
      ? `Index ${index} is still inside the sorted portion. Compare its value with the held key next.`
      : 'We reached the left edge. The vacant position at index 0 is the correct place for the key.'
    case 'compare': return `Is ${values[index!]} at index ${index} greater than the key ${key}? Only larger values must shift.`
    case 'shift': return `Shift ${values[shiftedTo!]} from index ${shiftedFrom} to ${shiftedTo}. Index ${vacantIndex} becomes vacant; the key ${key} is still held outside the array.`
    case 'stop': return `${values[index!]} is less than or equal to the key ${key}. Stop looking left and insert after it. Equal values keep their order.`
    case 'insert': return `Insert the held key ${values[insertedIndex!]} into vacant index ${insertedIndex}. All values are back in the array, and the first ${event.sortedCount} are ordered.`
    case 'pass-end': return `Pass ${pass} is complete. The sorted portion now contains ${event.sortedCount} values. Later keys may still shift them right.`
    case 'complete': return values.length < 2
      ? 'Already sorted. Fewer than two elements need no comparisons or shifts.'
      : `Finished. All ${values.length} values are sorted in ascending order, with equal values in their original relative order.`
  }
}

export function createInsertionSortTrace(input: readonly number[]): readonly InsertionSortStep[] {
  if (input.some((value) => !Number.isFinite(value))) {
    throw new RangeError('Insertion Sort requires finite numbers.')
  }
  const steps: InsertionSortStep[] = []
  // Identity tracking belongs to the trace, not the O(1)-space sorting core.
  const identities: (number | null)[] = input.map((_, index) => index)
  let keyOriginalIndex: number | null = null
  let comparisons = 0
  let shifts = 0
  insertionSort(input, (event, values) => {
    if (event.kind === 'key') {
      keyOriginalIndex = identities[event.outerIndex]
      identities[event.outerIndex] = null
    }
    if (event.kind === 'compare') comparisons += 1
    if (event.kind === 'shift') {
      shifts += 1
      identities[event.shiftedTo!] = identities[event.shiftedFrom!]
      identities[event.shiftedFrom!] = null
    }
    if (event.kind === 'insert') {
      identities[event.insertedIndex!] = keyOriginalIndex
      keyOriginalIndex = null
    }
    steps.push({ ...event,
      values: values.map((value, index) => index === event.vacantIndex ? null : value),
      originalIndices: [...identities], keyOriginalIndex,
      lineId: event.kind, explanation: explain(event, values), comparisons, shifts })
  })
  return steps
}
