import type { PseudocodeLine } from '../../components/PseudocodePanel'
import type { QuickSortEventKind } from './quickSort'

export const quickSortCode: readonly PseudocodeLine<QuickSortEventKind>[] = [
  { id: 'start', text: 'copy input; quickSort(0, length - 1)', indent: 0 },
  { id: 'enter', text: 'quickSort(low, high): // inclusive', indent: 0 },
  { id: 'base-check', text: 'if low >= high:', indent: 1 },
  { id: 'base', text: 'return // empty or single element', indent: 2 },
  { id: 'pivot', text: 'pivot = values[high]', indent: 1 },
  { id: 'initialize', text: 'i = low - 1', indent: 1 },
  { id: 'scan', text: 'for j = low to high - 1:', indent: 1 },
  { id: 'compare', text: 'if values[j] <= pivot:', indent: 2 },
  { id: 'boundary', text: 'i = i + 1', indent: 3 },
  { id: 'swap', text: 'if i != j: swap values[i], values[j]', indent: 3 },
  { id: 'skip-swap', text: 'else: skip self-swap', indent: 3 },
  { id: 'keep', text: 'else: leave the greater value in place', indent: 2 },
  { id: 'scan-end', text: '// scan finished; pivot still at high', indent: 1 },
  { id: 'pivot-target', text: 'p = i + 1', indent: 1 },
  { id: 'pivot-swap', text: 'if p != high: swap values[p], values[high]', indent: 1 },
  { id: 'pivot-stay', text: 'else: skip pivot self-swap', indent: 1 },
  { id: 'pivot-fixed', text: '// pivot at p is in its final position', indent: 1 },
  { id: 'call-left', text: 'quickSort(low, p - 1)', indent: 1 },
  { id: 'return-left', text: '// left call returned', indent: 1 },
  { id: 'call-right', text: 'quickSort(p + 1, high)', indent: 1 },
  { id: 'return-right', text: '// right call returned', indent: 1 },
  { id: 'return', text: 'return // both recursive calls finished', indent: 1 },
  { id: 'complete', text: 'root returned: output sorted values', indent: 0 },
]
