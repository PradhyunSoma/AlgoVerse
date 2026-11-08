import type { PseudocodeLine } from '../../components/PseudocodePanel'
import type { CircularEventKind } from './circularListOperations'
import type { OperationKind } from './listOperations'

export function circularListCode(kind: OperationKind): readonly PseudocodeLine<CircularEventKind>[] {
  const line = (id: CircularEventKind, text: string, indent = 0) => ({ id, text, indent })
  const start = [line('ready', '// Apply an operation to begin'), line('start', `current = ${kind === 'insert-end' ? 'TAIL' : 'HEAD'}${kind === 'traverse' ? '' : '; index = 0; position = ' + (kind.endsWith('start') ? '0' : kind === 'insert-end' ? 'size' : kind === 'delete-end' ? 'size - 1' : 'input position')}`)]
  if (kind === 'traverse') return [...start,
    line('empty', 'if HEAD == NULL: return []'), line('visit', 'do: // visit current once'),
    line('read', 'output.append(current.data)', 1), line('follow', 'current = current.next', 1),
    line('complete', 'while current != HEAD; return output')]
  if (kind.startsWith('insert')) return [...start,
    line('visit', 'if 0 < position < size: walk to predecessor'),
    line('follow', 'current = current.next; index += 1', 1),
    line('locate', 'previous = TAIL at endpoints, else current; successor = previous.next if previous else NULL'),
    line('allocate', 'newNode = allocate(next = NULL)'), line('data', 'newNode.data = value'),
    line('new-next', 'newNode.next = successor if nonempty else newNode'),
    line('connect', 'if previous != NULL: previous.next = newNode'),
    line('head', 'if position == 0: HEAD = newNode'), line('tail', 'if position == size: TAIL = newNode'),
    line('complete', 'return HEAD, TAIL // circle complete')]
  return [...start, line('empty', 'if HEAD == NULL: return'),
    line('visit', 'while index < position: // previous starts at TAIL'),
    line('follow', 'previous = current; current = current.next; index += 1', 1),
    line('target', 'target = current; successor = target.next'),
    line('head', 'if size == 1: HEAD = NULL; else if target == HEAD: HEAD = successor'),
    line('bypass', 'if size > 1: previous.next = successor'),
    line('tail', 'if size == 1: TAIL = NULL; else if target == TAIL: TAIL = previous'),
    line('detach', 'target.next = NULL'), line('remove', 'release target'), line('complete', 'return HEAD, TAIL // circle restored')]
}
