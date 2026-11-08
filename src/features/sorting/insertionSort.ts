export type InsertionSortEventKind =
  | 'start' | 'pass' | 'key' | 'check' | 'compare' | 'shift'
  | 'stop' | 'insert' | 'pass-end' | 'complete'

export interface InsertionSortEvent {
  readonly kind: InsertionSortEventKind
  readonly pass: number
  readonly outerIndex: number
  readonly index: number | null
  readonly key: number | null
  readonly vacantIndex: number | null
  readonly insertedIndex: number | null
  readonly shiftedFrom: number | null
  readonly shiftedTo: number | null
  readonly sortedCount: number
}

export type InsertionSortObserver = (event: InsertionSortEvent, values: readonly number[]) => void

/** Sorts a private copy. A vacantIndex marks the inactive slot while key is held. */
export function insertionSort(input: readonly number[], observe?: InsertionSortObserver): number[] {
  const values = [...input]
  let pass = 0
  let outerIndex = 0
  let index: number | null = null
  let key: number | null = null
  let vacantIndex: number | null = null
  let sortedCount = Math.min(1, values.length)

  function emit(kind: InsertionSortEventKind, shiftedFrom: number | null = null,
    shiftedTo: number | null = null, insertedIndex: number | null = null) {
    observe?.({ kind, pass, outerIndex, index, key, vacantIndex,
      shiftedFrom, shiftedTo, insertedIndex, sortedCount }, values)
  }

  emit('start')
  for (outerIndex = 1; outerIndex < values.length; outerIndex += 1) {
    pass = outerIndex
    index = null
    emit('pass')
    key = values[outerIndex]
    vacantIndex = outerIndex
    index = outerIndex - 1
    emit('key')
    while (true) {
      emit('check')
      if (index < 0) break
      emit('compare')
      // Strict comparison preserves the order of equal values.
      if (values[index] <= key) {
        emit('stop')
        break
      }
      values[index + 1] = values[index]
      vacantIndex = index
      index -= 1
      emit('shift', index + 1, index + 2)
    }
    const destination = index + 1
    values[destination] = key
    key = null
    vacantIndex = null
    sortedCount = outerIndex + 1
    emit('insert', null, null, destination)
    index = null
    emit('pass-end')
  }
  index = null
  sortedCount = values.length
  emit('complete')
  return values
}
