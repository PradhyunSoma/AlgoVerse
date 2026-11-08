import type { PseudocodeLine } from '../../components/PseudocodePanel'
import type { MergeSortEventKind } from './mergeSort'

export const mergeSortCode: readonly PseudocodeLine<MergeSortEventKind>[] = [
  { id: 'start', text: 'copy input; call sort(0, length(values))', indent: 0 },
  { id: 'enter', text: 'sort(lo, hi): // hi is excluded', indent: 0 },
  { id: 'base-check', text: 'if hi - lo <= 1:', indent: 1 },
  { id: 'base', text: 'return // empty or single: already sorted', indent: 2 },
  { id: 'split', text: 'mid = lo + floor((hi - lo) / 2)', indent: 1 },
  { id: 'call-left', text: 'sort(lo, mid)', indent: 1 },
  { id: 'return-left', text: '// left call returned', indent: 1 },
  { id: 'call-right', text: 'sort(mid, hi)', indent: 1 },
  { id: 'return-right', text: '// right call returned', indent: 1 },
  { id: 'merge-start', text: 'clear buffer[lo..hi); left = lo; right = mid', indent: 1 },
  { id: 'compare', text: 'while both remain: values[left] <= values[right]?', indent: 1 },
  { id: 'take-left', text: 'if yes: append values[left]; advance left', indent: 2 },
  { id: 'take-right', text: 'else: append values[right]; advance right', indent: 2 },
  { id: 'drain-left', text: 'append each remaining left value', indent: 1 },
  { id: 'drain-right', text: 'append each remaining right value', indent: 1 },
  { id: 'copy', text: 'copy each buffer slot back to values', indent: 1 },
  { id: 'merge-end', text: '// values[lo..hi) are now merged', indent: 1 },
  { id: 'return', text: 'return // finished merge', indent: 1 },
  { id: 'complete', text: 'root returned: output sorted values', indent: 0 },
]
