export type MergeSortEventKind = 'start' | 'enter' | 'base-check' | 'base' | 'split'
  | 'call-left' | 'return-left' | 'call-right' | 'return-right' | 'merge-start'
  | 'compare' | 'take-left' | 'take-right' | 'drain-left' | 'drain-right'
  | 'copy' | 'merge-end' | 'return' | 'complete'

export interface MergeSortEvent {
  readonly kind: MergeSortEventKind
  readonly nodeId: string
  readonly parentId: string | null
  readonly depth: number
  /** Half-open ranges: lo is included, hi is excluded. */
  readonly lo: number
  readonly hi: number
  readonly mid: number | null
  readonly leftIndex: number | null
  readonly rightIndex: number | null
  readonly outputIndex: number | null
  readonly sourceIndex: number | null
  readonly destinationIndex: number | null
}

export type MergeSortObserver = (event: MergeSortEvent, values: readonly number[],
  buffer: readonly (number | null)[]) => void

/** Recursive stable Merge Sort with a single reusable O(n) buffer and private input copy. */
export function mergeSort(input: readonly number[], observe?: MergeSortObserver): number[] {
  const values = [...input]
  const buffer: (number | null)[] = Array(values.length).fill(null)
  const root = { nodeId: 'root', parentId: null, depth: 0, lo: 0, hi: values.length,
    mid: null, leftIndex: null, rightIndex: null, outputIndex: null,
    sourceIndex: null, destinationIndex: null } as const
  observe?.({ ...root, kind: 'start' }, values, buffer)

  function sort(lo: number, hi: number, nodeId: string, parentId: string | null, depth: number) {
    let mid: number | null = null
    let leftIndex: number | null = null
    let rightIndex: number | null = null
    let outputIndex: number | null = null
    function emit(kind: MergeSortEventKind, sourceIndex: number | null = null,
      destinationIndex: number | null = null) {
      observe?.({ kind, nodeId, parentId, depth, lo, hi, mid, leftIndex, rightIndex,
        outputIndex, sourceIndex, destinationIndex }, values, buffer)
    }
    emit('enter')
    emit('base-check')
    if (hi - lo <= 1) {
      emit('base')
      emit('return')
      return
    }
    mid = lo + Math.floor((hi - lo) / 2)
    emit('split')
    emit('call-left')
    sort(lo, mid, `${nodeId}/L`, nodeId, depth + 1)
    emit('return-left')
    emit('call-right')
    sort(mid, hi, `${nodeId}/R`, nodeId, depth + 1)
    emit('return-right')
    buffer.fill(null, lo, hi)
    leftIndex = lo
    rightIndex = mid
    outputIndex = lo
    emit('merge-start')
    function write(source: number, kind: 'take-left' | 'take-right' | 'drain-left' | 'drain-right') {
      const destination = outputIndex!
      buffer[destination] = values[source]
      outputIndex = destination + 1
      emit(kind, source, destination)
    }
    while (leftIndex < mid && rightIndex < hi) {
      emit('compare')
      // Taking the left value on equality preserves stability.
      if (values[leftIndex] <= values[rightIndex]) {
        const source = leftIndex++
        write(source, 'take-left')
      } else {
        const source = rightIndex++
        write(source, 'take-right')
      }
    }
    while (leftIndex < mid) {
      const source = leftIndex++
      write(source, 'drain-left')
    }
    while (rightIndex < hi) {
      const source = rightIndex++
      write(source, 'drain-right')
    }
    for (let destination = lo; destination < hi; destination += 1) {
      values[destination] = buffer[destination]!
      emit('copy', null, destination)
    }
    emit('merge-end')
    emit('return')
  }

  sort(0, values.length, 'root', null, 0)
  observe?.({ ...root, kind: 'complete' }, values, buffer)
  return values
}
