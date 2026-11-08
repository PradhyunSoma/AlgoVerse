import { assertList, createList, listNodes, type ListNode, type ListState, type NodeId } from './listModel'

export interface DoublyNode extends ListNode {
  readonly prev: NodeId | null
}
export interface DoublyState extends ListState {
  readonly tail: NodeId | null
  readonly nodes: Readonly<Partial<Record<NodeId, DoublyNode>>>
}

/** Also works on intermediate snapshots, when the two chains may differ. */
export function doublyNodes(state: DoublyState, direction: 'next' | 'prev' = 'next'): DoublyNode[] {
  const result: DoublyNode[] = []
  const seen = new Set<NodeId>()
  let id = direction === 'next' ? state.head : state.tail
  while (id !== null) {
    if (seen.has(id)) throw new Error(`Cycle in the ${direction} chain.`)
    const node = state.nodes[id]
    if (!node || node.id !== id) throw new Error('A pointer refers to a missing node.')
    seen.add(id)
    result.push(node)
    id = node[direction]
  }
  return result
}

/** Reciprocal links are required at operation boundaries, not between individual writes. */
export function assertDoublyList(state: DoublyState) {
  assertList(state)
  const forward = doublyNodes(state)
  if (state.tail !== (forward.at(-1)?.id ?? null)) throw new Error('TAIL must reference the last node.')
  for (let index = 0; index < forward.length; index += 1) {
    if (forward[index].prev !== (forward[index - 1]?.id ?? null)) throw new Error('Adjacent prev and next pointers must be reciprocal.')
  }
  const backward = doublyNodes(state, 'prev')
  if (backward.map((node) => node.id).join() !== forward.map((node) => node.id).reverse().join()) {
    throw new Error('Forward and backward chains must contain the same nodes.')
  }
}

export function toDoublyList(state: ListState): DoublyState {
  assertList(state)
  const ordered = listNodes(state)
  const nodes = Object.fromEntries(ordered.map((node, index) => [node.id, { ...node, prev: ordered[index - 1]?.id ?? null }]))
  const result = { ...state, nodes, tail: ordered.at(-1)?.id ?? null }
  assertDoublyList(result)
  return result
}

export function toSinglyList(state: DoublyState): ListState {
  assertDoublyList(state)
  return { head: state.head, nextId: state.nextId, nodes: Object.fromEntries(doublyNodes(state).map(({ id, value, next }) => [id, { id, value, next }])) }
}

export function createDoublyList(values: readonly number[] = [10, 20, 30], nextId = 1): DoublyState {
  return toDoublyList(createList(values, nextId))
}

export function copyDoublyList(state: DoublyState): DoublyState {
  return { ...state, nodes: Object.fromEntries(Object.values(state.nodes).map((node) => [node!.id, { ...node! }])) }
}
