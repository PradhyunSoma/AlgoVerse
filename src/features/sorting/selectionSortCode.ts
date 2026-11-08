import type { PseudocodeLine } from '../../components/PseudocodePanel'
import type { SelectionSortEventKind } from './selectionSort'

export const selectionSortCode: readonly PseudocodeLine<SelectionSortEventKind>[] = [
  { id: 'start', text: 'n = length(values)', indent: 0 },
  { id: 'pass', text: 'for start = 0 to n - 2:', indent: 0 },
  { id: 'minimum', text: 'min = start', indent: 1 },
  { id: 'scan', text: 'for scan = start + 1 to n - 1:', indent: 1 },
  { id: 'compare', text: 'if values[scan] < values[min]:', indent: 2 },
  { id: 'new-minimum', text: 'min = scan', indent: 3 },
  { id: 'keep-minimum', text: 'else: keep the current minimum', indent: 2 },
  { id: 'check-swap', text: 'if min != start:', indent: 1 },
  { id: 'swap', text: 'swap values[start] and values[min]', indent: 2 },
  { id: 'no-swap', text: 'else: no swap needed', indent: 1 },
  { id: 'pass-end', text: '// values[0..start] are now sorted', indent: 1 },
  { id: 'complete', text: 'return values', indent: 0 },
]
