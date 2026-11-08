import type { PseudocodeLine } from '../../components/PseudocodePanel'
import type { InsertionSortEventKind } from './insertionSort'

export const insertionSortCode: readonly PseudocodeLine<InsertionSortEventKind>[] = [
  { id: 'start', text: '// first element is already sorted', indent: 0 },
  { id: 'pass', text: 'for i = 1 to length(values) - 1:', indent: 0 },
  { id: 'key', text: 'hold key = values[i]; j = i - 1', indent: 1 },
  { id: 'check', text: 'while j >= 0:', indent: 1 },
  { id: 'compare', text: 'if values[j] > key:', indent: 2 },
  { id: 'shift', text: 'move values[j] right; j = j - 1', indent: 3 },
  { id: 'stop', text: 'else: break // keep equal values in order', indent: 2 },
  { id: 'insert', text: 'values[j + 1] = key // fill vacant slot', indent: 1 },
  { id: 'pass-end', text: '// values[0..i] are now ordered', indent: 1 },
  { id: 'complete', text: 'return values', indent: 0 },
]
