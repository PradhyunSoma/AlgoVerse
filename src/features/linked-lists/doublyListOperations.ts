import { operationLabels, validateOperation, type ListOperation } from './listOperations'
import { assertDoublyList, copyDoublyList, doublyNodes, type DoublyNode, type DoublyState } from './doublyListModel'
import type { NodeId } from './listModel'

export const doublyOperationLabels = { ...operationLabels, traverse: 'Traverse forward', 'traverse-backward': 'Traverse backward' } as const
export type DoublyOperation = ListOperation | { kind: 'traverse-backward' }
export type DoublyOperationKind = DoublyOperation['kind']
export type DoublyEventKind = 'ready' | 'start' | 'visit' | 'read' | 'follow' | 'locate' | 'allocate' | 'data'
  | 'new-prev' | 'new-next' | 'connect-left' | 'connect-right' | 'insert-head' | 'insert-tail'
  | 'target' | 'bypass-left' | 'bypass-right' | 'delete-head' | 'delete-tail' | 'detach-prev' | 'detach-next'
  | 'remove' | 'empty' | 'complete'
export interface DoublyPointer {
  readonly source: 'HEAD' | 'TAIL' | NodeId
  readonly field: 'head' | 'tail' | 'prev' | 'next'
}
export interface DoublyChange extends DoublyPointer {
  readonly from: NodeId | null
  readonly to: NodeId | null
}
export interface DoublyEvent {
  readonly kind: DoublyEventKind
  readonly explanation: string
  readonly current: NodeId | null
  readonly left: NodeId | null
  readonly right: NodeId | null
  readonly held: NodeId | null
  readonly newId: NodeId | null
  readonly dataAssigned: boolean
  readonly removed: DoublyNode | null
  readonly pointer: DoublyChange | null
  readonly followed: DoublyPointer | null
  readonly visited: readonly number[]
  readonly layout: readonly NodeId[]
}
type Observer = (event: DoublyEvent, state: DoublyState) => void

export function validateDoublyOperation(state: DoublyState, operation: DoublyOperation) {
  assertDoublyList(state)
  if (operation.kind !== 'traverse-backward') validateOperation(state, operation)
}

/** Each emitted write changes one reference, even when reciprocity needs another write. */
export function runDoublyOperation(input: DoublyState, operation: DoublyOperation, observe?: Observer): DoublyState {
  validateDoublyOperation(input, operation)
  const copy = copyDoublyList(input)
  const nodes = { ...copy.nodes }
  let { head, tail, nextId } = copy
  const layout = doublyNodes(input).map((node) => node.id)
  const visited: number[] = []
  let current: NodeId | null = null
  let left: NodeId | null = null
  let right: NodeId | null = null
  let held: NodeId | null = null
  let newId: NodeId | null = null
  let dataAssigned = true
  let removed: DoublyNode | null = null
  function emit(kind: DoublyEventKind, explanation: string, pointer: DoublyChange | null = null, followed: DoublyPointer | null = null) {
    observe?.({ kind, explanation, current, left, right, held, newId, dataAssigned, removed, pointer, followed, visited, layout }, { head, tail, nextId, nodes })
  }
  function writeNode(id: NodeId, field: 'prev' | 'next', to: NodeId | null, kind: DoublyEventKind, explanation: string) {
    const from = nodes[id]![field]
    nodes[id] = { ...nodes[id]!, [field]: to }
    emit(kind, explanation, { source: id, field, from, to })
  }
  function writeEnd(field: 'head' | 'tail', to: NodeId | null, kind: DoublyEventKind, explanation: string) {
    const from = field === 'head' ? head : tail
    if (field === 'head') head = to
    else tail = to
    emit(kind, explanation, { source: field === 'head' ? 'HEAD' : 'TAIL', field, from, to })
  }
  function follow(field: 'prev' | 'next') {
    const source = current!
    current = nodes[source]![field]
    emit('follow', `Follow ${source}.${field} to ${current ?? 'NULL'}.`, null, { source, field })
  }
  const fromTail = operation.kind === 'traverse-backward' || operation.kind === 'insert-end' || operation.kind === 'delete-end'
  current = fromTail ? tail : head
  emit('start', `Start at ${fromTail ? 'TAIL' : 'HEAD'} → ${current ?? 'NULL'}.`, null,
    { source: fromTail ? 'TAIL' : 'HEAD', field: fromTail ? 'tail' : 'head' })
  if (operation.kind === 'traverse' || operation.kind === 'traverse-backward') {
    const direction = operation.kind === 'traverse' ? 'next' : 'prev'
    while (current !== null) {
      emit('visit', `Visit ${current}. Follow ${direction} after reading its data.`)
      visited.push(nodes[current]!.value)
      emit('read', `Read ${nodes[current]!.value} from ${current} and append it to the traversal sequence.`)
      follow(direction)
    }
    emit('complete', `Reached NULL. ${direction === 'next' ? 'Forward' : 'Backward'} traversal complete: ${visited.length ? visited.join(' → ') : 'no nodes to visit'}.`)
  } else if ('value' in operation) {
    if (operation.kind === 'insert-start') { left = null; right = head }
    else if (operation.kind === 'insert-end') { left = tail; right = null }
    else {
      for (let index = 0; index < operation.position; index += 1) {
        emit('visit', `Visit ${current} at position ${index}; walk forward to insertion position ${operation.position}.`)
        follow('next')
      }
      right = current
      left = right === null ? tail : nodes[right]!.prev
    }
    emit('locate', `Insert between left ${left ?? 'NULL'} and right ${right ?? 'NULL'}. Keep both references while links change.`)
    newId = `n${nextId++}`
    held = newId
    nodes[newId] = { id: newId, value: 0, prev: null, next: null }
    layout.splice(right === null ? layout.length : layout.indexOf(right), 0, newId)
    dataAssigned = false
    emit('allocate', `Allocate ${newId} with prev and next initialized to NULL. Hold it as newNode; neither chain includes it yet.`)
    nodes[newId] = { ...nodes[newId]!, value: operation.value }
    dataAssigned = true
    emit('data', `Set ${newId}.data to ${operation.value}.`)
    writeNode(newId, 'prev', left, 'new-prev', `Set ${newId}.prev to ${left ?? 'NULL'}. The new node is still held locally.`)
    writeNode(newId, 'next', right, 'new-next', `Set ${newId}.next to ${right ?? 'NULL'}. Existing neighbors still point to each other.`)
    if (left !== null) writeNode(left, 'next', newId, 'connect-left', `Set ${left}.next to ${newId}. The forward chain now includes the new node; the backward connection is still pending.`)
    else writeEnd('head', newId, 'insert-head', `Update HEAD to ${newId}. The forward chain includes it; the backward connection is still pending.`)
    if (right !== null) writeNode(right, 'prev', newId, 'connect-right', `Set ${right}.prev to ${newId}. Both directions now include the new node.`)
    else writeEnd('tail', newId, 'insert-tail', `Update TAIL to ${newId}. Both directions now include the new node.`)
    current = left = right = held = newId = null
    emit('complete', 'Insertion complete. All next and prev links are reciprocal; save this list for the next operation.')
  } else if (head === null) {
    emit('empty', 'HEAD and TAIL are NULL. There is nothing to delete.')
    emit('complete', 'Deletion complete without changes. The list remains empty.')
  } else {
    if (operation.kind === 'delete-position') {
      for (let index = 0; index < operation.position; index += 1) {
        emit('visit', `Visit ${current} at position ${index}; continue to deletion position ${operation.position}.`)
        follow('next')
      }
    }
    held = current
    const target = nodes[held!]!
    left = target.prev
    right = target.next
    emit('target', `Hold target ${target.id}. Its left neighbor is ${left ?? 'NULL'} and its right neighbor is ${right ?? 'NULL'}.`)
    if (left !== null) writeNode(left, 'next', right, 'bypass-left', `Set ${left}.next to ${right ?? 'NULL'}. The forward chain bypasses the target; the backward chain still includes it.`)
    else writeEnd('head', right, 'delete-head', `Update HEAD to ${right ?? 'NULL'}. The forward chain bypasses the target; the backward chain still includes it.`)
    if (right !== null) writeNode(right, 'prev', left, 'bypass-right', `Set ${right}.prev to ${left ?? 'NULL'}. Both chains now bypass the target, which remains held locally.`)
    else writeEnd('tail', left, 'delete-tail', `Update TAIL to ${left ?? 'NULL'}. Both chains now bypass the target, which remains held locally.`)
    writeNode(target.id, 'prev', null, 'detach-prev', `Clear ${target.id}.prev. The detached target no longer points to its left neighbor.`)
    writeNode(target.id, 'next', null, 'detach-next', `Clear ${target.id}.next. Both target pointers are NULL; it is safe to release the local reference.`)
    removed = { ...nodes[target.id]! }
    delete nodes[target.id]
    held = current = null
    emit('remove', `Release ${target.id}. The Removed card is historical and no longer represents an allocated node.`)
    removed = null
    layout.splice(layout.indexOf(target.id), 1)
    left = right = null
    emit('complete', 'Deletion complete. All remaining next and prev links are reciprocal; save this list for the next operation.')
  }
  const result = copyDoublyList({ head, tail, nextId, nodes })
  assertDoublyList(result)
  return result
}
