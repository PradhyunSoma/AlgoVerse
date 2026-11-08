import { assertList, assertValue, copyList, listNodes, MAX_LIST_SIZE, type ListNode, type ListState, type NodeId } from './listModel'

export const operationLabels = {
  traverse: 'Traverse',
  'insert-start': 'Insert at beginning',
  'insert-end': 'Insert at end',
  'insert-position': 'Insert at position',
  'delete-start': 'Delete from beginning',
  'delete-end': 'Delete from end',
  'delete-position': 'Delete from position',
} as const
export type OperationKind = keyof typeof operationLabels
export type ListOperation = { kind: 'traverse' } | { kind: 'delete-start' } | { kind: 'delete-end' }
  | { kind: 'delete-position'; position: number }
  | { kind: 'insert-start'; value: number } | { kind: 'insert-end'; value: number }
  | { kind: 'insert-position'; value: number; position: number }
export type ListEventKind = 'ready' | 'start' | 'visit' | 'read' | 'follow' | 'locate' | 'allocate' | 'data'
  | 'link-new' | 'link-head' | 'link-previous' | 'target' | 'bypass-head' | 'bypass-previous' | 'remove' | 'empty' | 'complete'
export interface PointerChange {
  readonly source: 'HEAD' | NodeId
  readonly from: NodeId | null
  readonly to: NodeId | null
}
export interface ListEvent {
  readonly kind: ListEventKind
  readonly explanation: string
  readonly current: NodeId | null
  readonly previous: NodeId | null
  readonly held: NodeId | null
  readonly newId: NodeId | null
  readonly dataAssigned: boolean
  readonly removed: ListNode | null
  readonly pointer: PointerChange | null
  readonly followed: 'HEAD' | NodeId | null
  readonly visited: readonly number[]
  readonly layout: readonly NodeId[]
}
export type ListObserver = (event: ListEvent, state: ListState) => void

export function validateOperation(state: ListState, operation: ListOperation) {
  assertList(state)
  const size = listNodes(state).length
  if ('value' in operation) {
    assertValue(operation.value)
    if (size >= MAX_LIST_SIZE) throw new RangeError(`The list is full. Delete a node first (maximum ${MAX_LIST_SIZE}).`)
  }
  if ('position' in operation) {
    const max = 'value' in operation ? size : size - 1
    if (!Number.isInteger(operation.position) || operation.position < 0 || operation.position > max) {
      throw new RangeError(max < 0 ? 'The list is empty. There is no position to delete.' : `Position must be an integer from 0 to ${max}.`)
    }
  }
}

/** Operates on private nodes. The observer records the real order of pointer updates. */
export function runListOperation(input: ListState, operation: ListOperation, observe?: ListObserver): ListState {
  validateOperation(input, operation)
  const copy = copyList(input)
  const nodes = { ...copy.nodes }
  let head = copy.head
  let nextId = copy.nextId
  const layout = listNodes(input).map((node) => node.id)
  const size = layout.length
  let current: NodeId | null = null
  let previous: NodeId | null = null
  let held: NodeId | null = null
  let newId: NodeId | null = null
  let dataAssigned = true
  let removed: ListNode | null = null
  const visited: number[] = []
  function emit(kind: ListEventKind, explanation: string, pointer: PointerChange | null = null, followed: 'HEAD' | NodeId | null = null) {
    observe?.({ kind, explanation, current, previous, held, newId, dataAssigned, removed, pointer, followed, visited, layout }, { head, nodes, nextId })
  }
  function follow() {
    const source = current!
    previous = source
    current = nodes[source]!.next
    emit('follow', `Follow ${source}.next to ${current ?? 'NULL'}.`, null, source)
  }
  current = head
  emit('start', `Start at HEAD → ${head ?? 'NULL'}. Positions are counted from 0.`, null, 'HEAD')
  if (operation.kind === 'traverse') {
    while (current !== null) {
      emit('visit', `Visit ${current}. Its next reference is ${nodes[current]!.next ?? 'NULL'}.`)
      visited.push(nodes[current]!.value)
      emit('read', `Read ${nodes[current]!.value} from ${current}. Append it to the traversal sequence.`)
      follow()
    }
    emit('complete', `Reached NULL. Traversal complete: ${visited.length ? visited.join(' → ') : 'no nodes to visit'}.`)
  } else if ('value' in operation) {
    const position = operation.kind === 'insert-start' ? 0 : operation.kind === 'insert-end' ? size : operation.position
    // Keep the predecessor in current while finding the insertion point.
    for (let index = 0; index < position - 1; index += 1) {
      emit('visit', `Visit ${current} at position ${index}; keep looking for the predecessor.`)
      follow()
    }
    previous = position === 0 ? null : current
    const successor = previous === null ? head : nodes[previous]!.next
    emit('locate', position === 0 ? 'Insert before HEAD. No predecessor is needed.' : `Found predecessor ${previous}. Save its next reference ${successor ?? 'NULL'}.`)
    newId = `n${nextId++}`
    held = newId
    // Numeric storage is initialized to zero; the trace hides it until the data assignment.
    nodes[newId] = { id: newId, value: 0, next: null }
    dataAssigned = false
    layout.splice(position, 0, newId)
    emit('allocate', `Allocate ${newId}, held by the local newNode reference. It is not reachable from HEAD yet; next starts at NULL.`)
    nodes[newId] = { ...nodes[newId]!, value: operation.value }
    dataAssigned = true
    emit('data', `Set ${newId}.data to ${operation.value}.`)
    nodes[newId] = { ...nodes[newId]!, next: successor }
    emit('link-new', `Set ${newId}.next to ${successor ?? 'NULL'} before connecting the predecessor. The existing chain is preserved.`, { source: newId, from: null, to: successor })
    if (previous === null) {
      const oldHead = head
      head = newId
      emit('link-head', `Update HEAD from ${oldHead ?? 'NULL'} to ${newId}. The new node is now part of the list.`, { source: 'HEAD', from: oldHead, to: newId })
    } else {
      nodes[previous] = { ...nodes[previous]!, next: newId }
      emit('link-previous', `Update ${previous}.next from ${successor ?? 'NULL'} to ${newId}. The remaining chain is reachable through ${newId}.next.`, { source: previous, from: successor, to: newId })
    }
    held = null
    current = null
    previous = null
    newId = null
    emit('complete', 'Insertion complete. This resulting list is ready for the next operation.')
  } else if (head === null) {
    emit('empty', 'HEAD is NULL. The list is empty, so there is nothing to delete.')
    emit('complete', 'Deletion complete without changes. The list remains empty.')
  } else {
    const position = operation.kind === 'delete-start' ? 0 : operation.kind === 'delete-end' ? size - 1 : operation.position
    for (let index = 0; index < position; index += 1) {
      emit('visit', `Visit ${current} at position ${index}; the deletion target is farther along.`)
      follow()
    }
    held = current
    const target = nodes[held!]!
    emit('target', `Keep ${held} in the local target reference. Its successor is ${target.next ?? 'NULL'}.`)
    if (previous === null) {
      head = target.next
      emit('bypass-head', `Update HEAD from ${target.id} to ${head ?? 'NULL'}. The target is detached but still held locally.`, { source: 'HEAD', from: target.id, to: head })
    } else {
      nodes[previous] = { ...nodes[previous]!, next: target.next }
      emit('bypass-previous', `Set ${previous}.next to ${target.next ?? 'NULL'}, bypassing ${target.id}. The target is still held locally.`, { source: previous, from: target.id, to: target.next })
    }
    removed = { ...target }
    delete nodes[target.id]
    current = null
    held = null
    emit('remove', `Release ${target.id}. Its former card is shown as Removed; it is no longer an allocated list node.`)
    removed = null
    layout.splice(layout.indexOf(target.id), 1)
    previous = null
    emit('complete', 'Deletion complete. The remaining links form the list for the next operation.')
  }
  const result = copyList({ head, nodes, nextId })
  assertList(result)
  return result
}
