import type { SortingStep } from './bubbleSortTrace'
import type { SelectionSortStep } from './selectionSortTrace'
import type { InsertionSortStep } from './insertionSortTrace'
import type { MergeSortStep } from './mergeSortTrace'
import type { QuickSortStep } from './quickSortTrace'

export type BarState = 'Ready' | 'Compare' | 'Scan' | 'Minimum' | 'Scan + min' | 'Swap' | 'Sorted'
  | 'Key' | 'Shift' | 'Vacant' | 'Active' | 'Left' | 'Right' | 'Selected' | 'Destination' | 'Merged'
  | 'Pivot' | 'Pivot placed' | 'Boundary' | '≤ pivot' | '> pivot' | 'Unseen'
export type SortingSnapshot = SortingStep | SelectionSortStep | InsertionSortStep | MergeSortStep | QuickSortStep

/** Translate algorithm-specific metadata into labels shared by the bar renderer. */
export function barStates(step: SortingSnapshot): readonly BarState[] {
  return step.values.map((_, index): BarState => {
    if ('finalIndices' in step) {
      if (step.kind === 'pivot-fixed' && index === step.pivotIndex) return 'Pivot placed'
      if (step.finalIndices.includes(index)) return 'Sorted'
      if (step.kind === 'start' || index < step.low || index > step.high) return 'Ready'
      if (step.swapIndices?.includes(index)) return 'Swap'
      if (index === step.pivotIndex) return 'Pivot'
      if (step.pivotValue === null || step.i === null) return 'Active'
      if (step.kind === 'boundary' && index === step.i) return 'Boundary'
      if (index === step.j) return 'Scan'
      const acceptedEnd = step.i - (step.kind === 'boundary' ? 1 : 0)
      if (index <= acceptedEnd) return '≤ pivot'
      const placed = step.pivotIndex !== null && step.finalIndices.includes(step.pivotIndex)
      const scannedEnd = placed ? step.high : step.j !== null
        ? step.j - (['scan', 'compare', 'boundary'].includes(step.kind) ? 1 : 0)
        : step.kind === 'initialize' ? step.low - 1 : step.high - 1
      return index <= scannedEnd ? '> pivot' : 'Unseen'
    }
    if ('nodes' in step) {
      if (step.kind === 'complete') return 'Sorted'
      const inRange = index >= step.lo && index < step.hi
      if (step.kind === 'copy' && inRange) return index === step.destinationIndex ? 'Destination' : 'Active'
      if (index === step.sourceIndex) return 'Selected'
      if (step.kind === 'compare' && (index === step.leftIndex || index === step.rightIndex)) return 'Compare'
      if (step.sourceValues !== null && step.kind !== 'merge-end' && inRange) return index < step.mid! ? 'Left' : 'Right'
      if (inRange && !['base', 'return', 'merge-end'].includes(step.kind) && step.kind !== 'start') return 'Active'
      if (step.nodes.some((node) => node.result !== null && index >= node.lo && index < node.hi)) return 'Merged'
      return 'Ready'
    }
    if ('vacantIndex' in step) {
      if (index === step.vacantIndex) return 'Vacant'
      if (index === step.insertedIndex) return 'Key'
      if (index === step.shiftedTo) return 'Shift'
      if ((step.kind === 'compare' || step.kind === 'stop') && index === step.index) return 'Compare'
      // While holding a key, the ordered values straddle a single vacant slot.
      if (index < step.sortedCount || (step.key !== null && index === step.outerIndex)) return 'Sorted'
      return 'Ready'
    }
    if ('sortedFrom' in step) {
      if (step.index !== null && (index === step.index || index === step.index + 1)) {
        return step.kind === 'swap' ? 'Swap' : 'Compare'
      }
      return index >= step.sortedFrom ? 'Sorted' : 'Ready'
    }
    if (step.swapIndices?.includes(index)) return 'Swap'
    if (index < step.sortedCount) return 'Sorted'
    if (index === step.minimumIndex && index === step.scanIndex) return 'Scan + min'
    if (index === step.minimumIndex) return 'Minimum'
    if (index === step.scanIndex) return 'Scan'
    return 'Ready'
  })
}

export function barClass(state: BarState): string {
  if (state === '≤ pivot') return 'bar-less-equal'
  if (state === '> pivot') return 'bar-greater'
  if (state === 'Pivot placed') return 'bar-pivot-placed'
  return state === 'Scan + min' ? 'bar-scan-minimum' : `bar-${state.toLowerCase()}`
}

/** Pointer labels are independent of color states, so a bar can show both i and j. */
export function quickMarkers(step: QuickSortStep): readonly string[] {
  return step.values.map((_, index) => {
    const labels: string[] = []
    if (step.kind === 'start' || step.kind === 'complete' || step.low > step.high) return ''
    if (index === step.low) labels.push('low')
    if (index === step.high) labels.push('high')
    if (index === step.i && step.i >= step.low) labels.push('i')
    if (index === step.j) labels.push('j')
    if (step.swapIndices?.includes(index) && index === step.pivotIndex) labels.push('pivot')
    return labels.join(' · ')
  })
}

