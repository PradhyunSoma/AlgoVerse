import type { PseudocodeLine } from '../../components/PseudocodePanel'
import type { DoublyEventKind, DoublyOperationKind } from './doublyListOperations'

export function doublyListCode(kind: DoublyOperationKind): readonly PseudocodeLine<DoublyEventKind>[] {
  const line = (id: DoublyEventKind, text: string, indent = 0) => ({ id, text, indent })
  const fromTail = kind === 'traverse-backward' || kind === 'insert-end' || kind === 'delete-end'
  const start = [line('ready', '// Apply a valid operation to begin'), line('start', `current = ${fromTail ? 'TAIL' : 'HEAD'}; index = 0`)]
  if (kind === 'traverse' || kind === 'traverse-backward') return [...start,
    line('visit', 'while current != NULL:', 1), line('read', 'output.append(current.data)', 2),
    line('follow', `current = current.${kind === 'traverse' ? 'next' : 'prev'}`, 2), line('complete', 'return output // reached NULL')]
  const walk = kind.endsWith('position') ? [line('visit', 'while index < position:', 1), line('follow', 'current = current.next; index += 1', 2)] : []
  if (kind.startsWith('insert')) return [...start, ...walk,
    line('locate', kind === 'insert-start' ? 'left = NULL; right = HEAD' : kind === 'insert-end' ? 'left = TAIL; right = NULL'
      : 'right = current; left = right.prev if right else TAIL'),
    line('allocate', 'newNode = allocate(prev = NULL, next = NULL)'), line('data', 'newNode.data = value'),
    line('new-prev', 'newNode.prev = left'), line('new-next', 'newNode.next = right'),
    line('connect-left', 'if left != NULL: left.next = newNode'), line('insert-head', 'else: HEAD = newNode'),
    line('connect-right', 'if right != NULL: right.prev = newNode'), line('insert-tail', 'else: TAIL = newNode'),
    line('complete', 'return HEAD, TAIL // reciprocal links restored')]
  return [...start, line('empty', 'if HEAD == NULL: return // nothing to delete'), ...walk,
    line('target', 'target = current; left = target.prev; right = target.next'),
    line('bypass-left', 'if left != NULL: left.next = right'), line('delete-head', 'else: HEAD = right'),
    line('bypass-right', 'if right != NULL: right.prev = left'), line('delete-tail', 'else: TAIL = left'),
    line('detach-prev', 'target.prev = NULL'), line('detach-next', 'target.next = NULL'), line('remove', 'release target'),
    line('complete', 'return HEAD, TAIL // reciprocal links restored')]
}
