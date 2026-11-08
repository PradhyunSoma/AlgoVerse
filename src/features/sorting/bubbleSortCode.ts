import type { PseudocodeLine } from '../../components/PseudocodePanel'
import type { BubbleSortEventKind } from './bubbleSort'

// Semantic IDs can also map to lines in future C++, Python, or Java examples.
export const bubbleSortCode: readonly PseudocodeLine<BubbleSortEventKind>[] = [
  { id: 'start', text: 'n = length(values)', indent: 0 },
  { id: 'pass', text: 'for end = n - 1 down to 1:', indent: 0 },
  { id: 'reset', text: 'swapped = false', indent: 1 },
  { id: 'pair', text: 'for i = 0 to end - 1:', indent: 1 },
  { id: 'compare', text: 'if values[i] > values[i + 1]:', indent: 2 },
  { id: 'swap', text: 'swap the pair, set swapped = true', indent: 3 },
  { id: 'keep', text: 'else: keep the pair in place', indent: 2 },
  { id: 'pass-end', text: '// values[end] is now sorted', indent: 1 },
  { id: 'check', text: 'if swapped is false:', indent: 1 },
  { id: 'early-exit', text: 'break // all values are sorted', indent: 2 },
  { id: 'complete', text: 'return values', indent: 0 },
]
