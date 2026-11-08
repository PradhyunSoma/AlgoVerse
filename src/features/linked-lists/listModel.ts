export type NodeId = `n${number}`

export interface ListNode {
  readonly id: NodeId
  readonly value: number
  readonly next: NodeId | null
}

/** References are stable IDs, resolved through this node table, not array positions. */
export interface ListState {
  readonly head: NodeId | null
  readonly nodes: Readonly<Partial<Record<NodeId, ListNode>>>
  readonly nextId: number
}

export const MAX_LIST_SIZE = 8
export const MIN_LIST_VALUE = -99
export const MAX_LIST_VALUE = 99

export function assertValue(value: number) {
  if (!Number.isInteger(value) || value < MIN_LIST_VALUE || value > MAX_LIST_VALUE) {
    throw new RangeError('Use an integer from -99 to 99.')
  }
}

export function listNodes(state: ListState): ListNode[] {
  const result: ListNode[] = []
  const visited = new Set<NodeId>()
  let id = state.head
  while (id !== null) {
    if (visited.has(id)) throw new Error('A singly linked list cannot contain a cycle.')
    const node = state.nodes[id]
    if (!node || node.id !== id) throw new Error('A pointer refers to a missing node.')
    visited.add(id)
    result.push(node)
    id = node.next
  }
  return result
}

/** Validate complete public states; transient detached nodes belong only to operation snapshots. */
export function assertList(state: ListState) {
  const ordered = listNodes(state)
  if (ordered.length !== Object.keys(state.nodes).length) throw new Error('Every list node must be reachable from HEAD.')
  if (ordered.length > MAX_LIST_SIZE) throw new RangeError(`Use at most ${MAX_LIST_SIZE} nodes.`)
  if (!Number.isSafeInteger(state.nextId) || state.nextId < 1) throw new Error('Invalid node ID counter.')
  for (const node of ordered) {
    assertValue(node.value)
    if (!/^n[1-9]\d*$/.test(node.id) || Number(node.id.slice(1)) >= state.nextId) throw new Error('Invalid node identity.')
  }
}

export function createList(values: readonly number[] = [10, 20, 30], nextId = 1): ListState {
  const nodes: Partial<Record<NodeId, ListNode>> = {}
  values.forEach((value, index) => {
    const id: NodeId = `n${nextId + index}`
    nodes[id] = { id, value, next: index < values.length - 1 ? `n${nextId + index + 1}` : null }
  })
  const state = { head: values.length ? `n${nextId}` as NodeId : null, nodes, nextId: nextId + values.length }
  assertList(state)
  return state
}

export function copyList(state: ListState): ListState {
  return { ...state, nodes: Object.fromEntries(Object.values(state.nodes).map((node) => [node!.id, { ...node! }])) }
}

export function listSummary(state: ListState) {
  return [...listNodes(state).map((node) => node.value), 'NULL'].join(' → ')
}
