export type BubbleSortEventKind =
  | 'start' | 'pass' | 'reset' | 'pair' | 'compare' | 'swap'
  | 'keep' | 'pass-end' | 'check' | 'early-exit' | 'complete'

export interface BubbleSortEvent {
  readonly kind: BubbleSortEventKind
  readonly pass: number
  readonly end: number
  readonly index: number | null
  readonly sortedFrom: number
  readonly swappedInPass: boolean
}

export type BubbleSortObserver = (event: BubbleSortEvent, values: readonly number[]) => void

/** Sorts a private copy of finite numbers. Observers must copy values to retain a step. */
export function bubbleSort(input: readonly number[], observe?: BubbleSortObserver): number[] {
  const values = [...input]
  let pass = 0
  let end = values.length - 1
  let sortedFrom = values.length
  let swappedInPass = false

  function emit(kind: BubbleSortEventKind, index: number | null = null) {
    observe?.({ kind, pass, end, index, sortedFrom, swappedInPass }, values)
  }

  emit('start')
  for (; end > 0; end -= 1) {
    pass += 1
    emit('pass')
    swappedInPass = false
    emit('reset')
    for (let index = 0; index < end; index += 1) {
      emit('pair', index)
      emit('compare', index)
      if (values[index] > values[index + 1]) {
        [values[index], values[index + 1]] = [values[index + 1], values[index]]
        swappedInPass = true
        emit('swap', index)
      } else {
        emit('keep', index)
      }
    }
    sortedFrom = end
    emit('pass-end')
    emit('check')
    if (!swappedInPass) {
      sortedFrom = 0
      emit('early-exit')
      break
    }
  }
  sortedFrom = 0
  emit('complete')
  return values
}
