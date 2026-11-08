import type { PseudocodeLine } from '../../components/PseudocodePanel'
import type { ListEventKind, OperationKind } from './listOperations'

export function listCode(kind: OperationKind): readonly PseudocodeLine<ListEventKind>[] {
  const line = (id: ListEventKind, text: string, indent = 0) => ({ id, text, indent })
  const start = [line('ready', '// Apply a valid operation to begin'), line('start', 'current = HEAD; previous = NULL; index = 0')]
  if (kind === 'traverse') return [...start,
    line('visit', 'while current != NULL:', 1), line('read', 'output.append(current.data)', 2),
    line('follow', 'previous = current; current = current.next', 2), line('complete', 'return output // reached NULL')]
  if (kind.startsWith('insert')) return [...start,
    ...(kind === 'insert-start' ? [] : [
      line('visit', kind === 'insert-end' ? 'while current != NULL and current.next != NULL:' : 'while position > 0 and index < position - 1:', 1),
      line('follow', 'previous = current; current = current.next; index += 1', 2),
    ]),
    line('locate', kind === 'insert-start' ? 'previous = NULL; successor = HEAD' : 'previous = predecessor or NULL; save successor'),
    line('allocate', 'newNode = allocate(next = NULL)'), line('data', 'newNode.data = value'),
    line('link-new', 'newNode.next = successor'), line('link-head', 'if previous == NULL: HEAD = newNode'),
    line('link-previous', 'else: previous.next = newNode'), line('complete', 'return HEAD')]
  return [...start, line('empty', 'if HEAD == NULL: return // nothing to delete'),
    ...(kind === 'delete-start' ? [] : [
      line('visit', kind === 'delete-end' ? 'while current.next != NULL:' : 'while index < position:', 1),
      line('follow', 'previous = current; current = current.next; index += 1', 2),
    ]), line('target', 'target = current'),
    line('bypass-head', 'if previous == NULL: HEAD = target.next'),
    line('bypass-previous', 'else: previous.next = target.next'), line('remove', 'release target'), line('complete', 'return HEAD')]
}
