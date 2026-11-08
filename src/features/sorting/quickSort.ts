export type QuickSortEventKind = 'start' | 'enter' | 'base-check' | 'base' | 'pivot' | 'initialize'
  | 'scan' | 'compare' | 'boundary' | 'swap' | 'skip-swap' | 'keep' | 'scan-end'
  | 'pivot-target' | 'pivot-swap' | 'pivot-stay' | 'pivot-fixed'
  | 'call-left' | 'return-left' | 'call-right' | 'return-right' | 'return' | 'complete'

export interface QuickSortEvent {
  readonly kind: QuickSortEventKind
  readonly callId: string
  readonly parentId: string | null
  readonly depth: number
  /** Inclusive boundaries; low > high describes an empty recursive call. */
  readonly low: number
  readonly high: number
  readonly pivotValue: number | null
  readonly pivotIndex: number | null
  readonly pivotTarget: number | null
  readonly i: number | null
  readonly j: number | null
  readonly swapIndices: readonly [number, number] | null
}

export type QuickSortObserver = (event: QuickSortEvent, values: readonly number[]) => void

/** Recursive Lomuto Quick Sort, choosing the last element and sorting a private copy. */
export function quickSort(input: readonly number[], observe?: QuickSortObserver): number[] {
  const values = [...input]
  let nextCallId = 1
  const root = { callId: 'root', parentId: null, depth: 0, low: 0, high: values.length - 1,
    pivotValue: null, pivotIndex: null, pivotTarget: null, i: null, j: null, swapIndices: null } as const
  observe?.({ ...root, kind: 'start' }, values)
  function sort(low: number, high: number, callId: string, parentId: string | null, depth: number) {
    let pivotValue: number | null = null
    let pivotIndex: number | null = null
    let pivotTarget: number | null = null
    let i: number | null = null
    let j: number | null = null
    function emit(kind: QuickSortEventKind, swapIndices: readonly [number, number] | null = null) {
      observe?.({ kind, callId, parentId, depth, low, high, pivotValue, pivotIndex, pivotTarget, i, j, swapIndices }, values)
    }
    function swap(left: number, right: number) {
      const value = values[left]
      values[left] = values[right]
      values[right] = value
    }
    emit('enter')
    emit('base-check')
    if (low >= high) {
      emit('base')
      emit('return')
      return
    }
    pivotValue = values[high]
    pivotIndex = high
    emit('pivot')
    i = low - 1
    emit('initialize')
    for (j = low; j < high; j += 1) {
      emit('scan')
      emit('compare')
      if (values[j] <= pivotValue) {
        i += 1
        emit('boundary')
        if (i !== j) {
          swap(i, j)
          emit('swap', [i, j])
        } else emit('skip-swap')
      } else emit('keep')
    }
    j = null
    emit('scan-end')
    pivotTarget = i + 1
    emit('pivot-target')
    if (pivotTarget !== high) {
      swap(pivotTarget, high)
      pivotIndex = pivotTarget
      emit('pivot-swap', [pivotTarget, high])
    } else emit('pivot-stay')
    emit('pivot-fixed')
    emit('call-left')
    sort(low, pivotTarget - 1, `call-${nextCallId++}`, callId, depth + 1)
    emit('return-left')
    emit('call-right')
    sort(pivotTarget + 1, high, `call-${nextCallId++}`, callId, depth + 1)
    emit('return-right')
    emit('return')
  }
  sort(0, values.length - 1, 'root', null, 0)
  observe?.({ ...root, kind: 'complete' }, values)
  return values
}
