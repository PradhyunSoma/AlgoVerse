export type SelectionSortEventKind =
  | 'start' | 'pass' | 'minimum' | 'scan' | 'compare' | 'new-minimum'
  | 'keep-minimum' | 'check-swap' | 'swap' | 'no-swap' | 'pass-end' | 'complete'

export interface SelectionSortEvent {
  readonly kind: SelectionSortEventKind
  readonly pass: number
  readonly startIndex: number
  readonly scanIndex: number | null
  readonly minimumIndex: number | null
  readonly sortedCount: number
  readonly swapIndices: readonly [number, number] | null
}

export type SelectionSortObserver = (event: SelectionSortEvent, values: readonly number[]) => void

/** Standard Selection Sort on a private copy. Observers copy values to retain a step. */
export function selectionSort(input: readonly number[], observe?: SelectionSortObserver): number[] {
  const values = [...input]
  let pass = 0
  let startIndex = 0
  let scanIndex: number | null = null
  let minimumIndex: number | null = null
  let sortedCount = 0

  function emit(kind: SelectionSortEventKind, swapIndices: readonly [number, number] | null = null) {
    observe?.({ kind, pass, startIndex, scanIndex, minimumIndex, sortedCount, swapIndices }, values)
  }

  emit('start')
  for (startIndex = 0; startIndex < values.length - 1; startIndex += 1) {
    pass = startIndex + 1
    minimumIndex = null
    emit('pass')
    minimumIndex = startIndex
    emit('minimum')
    for (scanIndex = startIndex + 1; scanIndex < values.length; scanIndex += 1) {
      emit('scan')
      emit('compare')
      if (values[scanIndex] < values[minimumIndex]) {
        minimumIndex = scanIndex
        emit('new-minimum')
      } else {
        emit('keep-minimum')
      }
    }
    scanIndex = null
    emit('check-swap')
    if (minimumIndex !== startIndex) {
      const source = minimumIndex
      const displaced = values[startIndex]
      values[startIndex] = values[source]
      values[source] = displaced
      emit('swap', [startIndex, source])
    } else {
      emit('no-swap')
    }
    sortedCount = startIndex + 1
    minimumIndex = null
    emit('pass-end')
  }
  sortedCount = values.length
  minimumIndex = null
  scanIndex = null
  emit('complete')
  return values
}
