/** Counts data operations only, never the number of teaching events. */
export interface OperationMetrics {
  readonly comparisons: number
  readonly swaps: number
  readonly arrayWrites: number
  readonly bufferWrites: number
  readonly shifts: number
}
export type SortingAlgorithm = 'bubble' | 'selection' | 'insertion' | 'merge' | 'quick'
export const zeroMetrics: OperationMetrics = Object.freeze({ comparisons: 0, swaps: 0, arrayWrites: 0, bufferWrites: 0, shifts: 0 })

/** Kinds are emitted at the actual comparison/assignment sites in each sort. */
export function recordOperation(previous: OperationMetrics, algorithm: SortingAlgorithm, kind: string): OperationMetrics {
  const next = { ...previous }
  if (kind === 'compare') next.comparisons++
  if ((algorithm === 'bubble' || algorithm === 'selection' || algorithm === 'quick') && (kind === 'swap' || kind === 'pivot-swap')) {
    next.swaps++
    next.arrayWrites += 2
  }
  if (algorithm === 'insertion') {
    if (kind === 'shift') { next.shifts++; next.arrayWrites++ }
    if (kind === 'insert') next.arrayWrites++
  }
  if (algorithm === 'merge') {
    if (['take-left', 'take-right', 'drain-left', 'drain-right'].includes(kind)) next.bufferWrites++
    if (kind === 'copy') next.arrayWrites++
  }
  return Object.freeze(next)
}
