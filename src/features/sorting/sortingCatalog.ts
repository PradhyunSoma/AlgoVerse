import BubbleSortInfo from './BubbleSortInfo'
import { bubbleSortCode } from './bubbleSortCode'
import { createBubbleSortTrace } from './bubbleSortTrace'
import SelectionSortInfo from './SelectionSortInfo'
import { selectionSortCode } from './selectionSortCode'
import { createSelectionSortTrace } from './selectionSortTrace'
import InsertionSortInfo from './InsertionSortInfo'
import { insertionSortCode } from './insertionSortCode'
import { createInsertionSortTrace } from './insertionSortTrace'
import MergeSortInfo from './MergeSortInfo'
import { mergeSortCode } from './mergeSortCode'
import { createMergeSortTrace } from './mergeSortTrace'
import QuickSortInfo from './QuickSortInfo'
import { quickSortCode } from './quickSortCode'
import { createQuickSortTrace } from './quickSortTrace'

export const sample = [5, 1, 4, 2, 8] as const
export const algorithms = {
  bubble: {
    title: 'Bubble Sort', description: 'Watch order take shape, one neighboring pair at a time.',
    tag: 'Early exit', createTrace: createBubbleSortTrace, code: bubbleSortCode, Info: BubbleSortInfo,
    legend: ['Ready', 'Compare', 'Swap', 'Sorted'],
  },
  selection: {
    title: 'Selection Sort', description: 'Find the smallest value. Give it a place. Repeat.',
    tag: 'Select the minimum', createTrace: createSelectionSortTrace, code: selectionSortCode, Info: SelectionSortInfo,
    legend: ['Ready', 'Scan', 'Minimum', 'Scan + min', 'Swap', 'Sorted'],
  },
  insertion: {
    title: 'Insertion Sort', description: 'Make room for the next key, one shift at a time.',
    tag: 'Stable insertion', createTrace: createInsertionSortTrace, code: insertionSortCode, Info: InsertionSortInfo,
    legend: ['Ready', 'Key', 'Compare', 'Shift', 'Vacant', 'Sorted'],
  },
  merge: {
    title: 'Merge Sort', description: 'Divide into smaller problems. Bring their answers together.',
    tag: 'Divide and conquer', createTrace: createMergeSortTrace, code: mergeSortCode, Info: MergeSortInfo,
    legend: ['Ready', 'Active', 'Left', 'Right', 'Compare', 'Selected', 'Destination', 'Merged', 'Sorted'],
  },
  quick: {
    title: 'Quick Sort', description: 'Place a pivot. Sort the two sides. Watch order emerge.',
    tag: 'Lomuto · Last-element pivot', createTrace: createQuickSortTrace, code: quickSortCode, Info: QuickSortInfo,
    legend: ['Pivot', 'Scan', 'Boundary', '≤ pivot', '> pivot', 'Unseen', 'Swap', 'Pivot placed', 'Sorted'],
  },
} as const
export type Algorithm = keyof typeof algorithms

