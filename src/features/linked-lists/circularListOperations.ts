import { type ListEvent, type ListOperation, validateOperation } from './listOperations'
import type { ListNode } from './listModel'
import { assertCircularList, circularToSingly, circularWalk, copyCircularList, type CircularState } from './circularListModel'
import type { NodeId } from './listModel'

export type CircularEventKind = 'ready' | 'start' | 'visit' | 'read' | 'follow' | 'locate' | 'allocate' | 'data'
  | 'new-next' | 'connect' | 'head' | 'tail' | 'target' | 'bypass' | 'detach' | 'remove' | 'empty' | 'complete'
export interface CircularChange { readonly source: 'HEAD' | 'TAIL' | NodeId; readonly from: NodeId | null; readonly to: NodeId | null }
export interface CircularEvent extends Omit<ListEvent, 'kind' | 'pointer' | 'followed'> {
  readonly kind: CircularEventKind
  readonly successor: NodeId | null
  readonly pointer: CircularChange | null
  readonly followed: 'HEAD' | 'TAIL' | NodeId | null
}
export function validateCircularOperation(state: CircularState, operation: ListOperation) {
  assertCircularList(state)
  validateOperation(circularToSingly(state), operation)
}

/** Pointer operations run on a private copy; the observer records writes in execution order. */
export function runCircularOperation(input: CircularState, operation: ListOperation,
  observe?: (event: CircularEvent, state: CircularState) => void): CircularState {
  validateCircularOperation(input, operation)
  const nodes = { ...copyCircularList(input).nodes }
  let { head, tail, nextId } = input
  const layout = circularWalk(input).nodes.map((node) => node.id)
  const size = layout.length
  let current: NodeId | null = head
  let previous: NodeId | null = null
  let successor: NodeId | null = null
  let held: NodeId | null = null
  let newId: NodeId | null = null
  let removed: ListNode | null = null
  let dataAssigned = true
  const visited: number[] = []
  const state = (): CircularState => ({ type: 'circular', head, tail, nextId, nodes })
  function emit(kind: CircularEventKind, explanation: string, pointer: CircularChange | null = null, followed: CircularEvent['followed'] = null) {
    observe?.({ kind, explanation, current, previous, successor, held, newId, removed, dataAssigned, visited, layout, pointer, followed }, state())
  }
  function write(source: CircularChange['source'], to: NodeId | null, kind: CircularEventKind, explanation: string) {
    const from = source === 'HEAD' ? head : source === 'TAIL' ? tail : nodes[source]!.next
    if (source === 'HEAD') head = to
    else if (source === 'TAIL') tail = to
    else nodes[source] = { ...nodes[source]!, next: to }
    emit(kind, explanation, { source, from, to })
  }
  function follow() {
    const source = current!
    previous = source
    current = nodes[source]!.next
    emit('follow', `Follow ${source}.next to ${current}. ${current === head ? 'Returned to HEAD; do not read it again.' : 'Continue along the circular chain.'}`, null, source)
  }
  // The maintained TAIL makes insertion at either endpoint constant-time.
  if (operation.kind === 'insert-end') current = tail
  emit('start', `Start at ${operation.kind === 'insert-end' ? 'TAIL' : 'HEAD'} → ${current ?? 'NULL'}. Positions start at 0.`, null, operation.kind === 'insert-end' ? 'TAIL' : 'HEAD')
  if (operation.kind === 'traverse') {
    if (head !== null) {
      do {
        emit('visit', `Visit ${current}. Each node is visited once in this lap.`)
        visited.push(nodes[current!]!.value)
        emit('read', `Read ${nodes[current!]!.value} from ${current}. Append it once to the traversal sequence.`)
        follow()
      } while (current !== head)
    } else emit('empty', 'HEAD is NULL. There are no nodes to visit.')
    emit('complete', head === null ? 'Traversal complete: no nodes to visit.' : `Returned to HEAD. Stop after one lap: ${visited.join(' → ')}. HEAD is not read twice.`)
  } else if ('value' in operation) {
    const position = operation.kind === 'insert-start' ? 0 : operation.kind === 'insert-end' ? size : operation.position
    if (position === 0 || position === size) previous = tail
    else {
      for (let index = 0; index < position - 1; index += 1) {
        emit('visit', `Visit ${current} at position ${index}; find the insertion predecessor.`)
        follow()
      }
      previous = current
    }
    successor = previous === null ? null : nodes[previous]!.next
    emit('locate', `Predecessor: ${previous ?? 'none'}. Successor: ${successor ?? 'none'}. Keep these references while connecting the new node.`)
    newId = `n${nextId++}`
    held = newId
    nodes[newId] = { id: newId, value: 0, next: null }
    layout.splice(position, 0, newId)
    dataAssigned = false
    emit('allocate', `Allocate ${newId}. It is held locally by newNode and is not yet reachable from HEAD.`)
    nodes[newId] = { ...nodes[newId]!, value: operation.value }
    dataAssigned = true
    emit('data', `Set ${newId}.data to ${operation.value}.`)
    write(newId, successor ?? newId, 'new-next', successor === null ? 'The first node points to itself, creating a self-loop.' : `Set newNode.next to ${successor} before connecting its predecessor.`)
    if (previous !== null) write(previous, newId, 'connect', `Set ${previous}.next to ${newId}. The node is connected; endpoint references are updated next if needed.`)
    if (position === 0) write('HEAD', newId, 'head', `Move HEAD to ${newId}. The closing next reference already reaches this new first node.`)
    if (position === size) write('TAIL', newId, 'tail', `Move TAIL to ${newId}. TAIL.next points to HEAD.`)
    current = previous = successor = held = newId = null
    emit('complete', 'Insertion complete. Every node is reachable, and TAIL.next points to HEAD.')
  } else if (head === null) {
    emit('empty', 'HEAD and TAIL are NULL. There is nothing to delete.')
    emit('complete', 'Deletion complete without changes. The list remains empty.')
  } else {
    const position = operation.kind === 'delete-start' ? 0 : operation.kind === 'delete-end' ? size - 1 : operation.position
    previous = tail
    for (let index = 0; index < position; index += 1) {
      emit('visit', `Visit ${current} at position ${index}; retain the predecessor while finding the target.`)
      follow()
    }
    held = current
    const target = nodes[held!]!
    successor = target.next
    emit('target', `Hold target ${target.id} locally. Predecessor: ${previous}; successor: ${successor}.`)
    if (size === 1) {
      write('HEAD', null, 'head', 'Clear HEAD. The only node remains held by target and TAIL temporarily.')
      write('TAIL', null, 'tail', 'Clear TAIL. The list is now empty; target is still held locally.')
    } else {
      if (target.id === head) write('HEAD', successor, 'head', `Move HEAD to ${successor}. The old head is still connected until TAIL.next is updated next.`)
      write(previous!, successor, 'bypass', `Set ${previous}.next to ${successor}, bypassing ${target.id}. The target is no longer reachable from HEAD.`)
      if (target.id === tail) write('TAIL', previous, 'tail', `Move TAIL to predecessor ${previous}. Its next reference closes the circle at HEAD.`)
    }
    write(target.id, null, 'detach', `Clear ${target.id}.next. The detached target is held locally until release.`)
    removed = { ...nodes[target.id]! }
    delete nodes[target.id]
    current = held = null
    emit('remove', `Release ${target.id}. The Removed card is a historical marker, not an allocated node.`)
    removed = null
    layout.splice(layout.indexOf(target.id), 1)
    previous = successor = null
    emit('complete', 'Deletion complete. The remaining nodes form one circle, or both endpoints are NULL if empty.')
  }
  const result = copyCircularList(state())
  assertCircularList(result)
  return result
}
