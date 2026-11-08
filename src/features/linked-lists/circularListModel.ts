import { assertList, copyList, createList, listNodes, type ListNode, type ListState, type NodeId } from './listModel'

export interface CircularState extends ListState {
  readonly type: 'circular'
  readonly tail: NodeId | null
}
export function isCircular(state: ListState): state is CircularState {
  return 'type' in state && state.type === 'circular'
}

/** Bounded inspection also supports transient open chains and cycles during pointer updates. */
export function circularWalk(state: CircularState) {
  const nodes: ListNode[] = []
  const seen = new Set<NodeId>()
  let current = state.head
  while (current !== null && !seen.has(current)) {
    const node = state.nodes[current]
    if (!node || node.id !== current) throw new Error('A pointer refers to a missing node.')
    seen.add(current)
    nodes.push(node)
    current = node.next
  }
  return { nodes, stoppedAt: current }
}

export function assertCircularList(state: CircularState) {
  const { nodes, stoppedAt } = circularWalk(state)
  if (!nodes.length) {
    if (state.head !== null || state.tail !== null || Object.keys(state.nodes).length) throw new Error('An empty circular list must have NULL endpoints and no nodes.')
  } else if (stoppedAt !== state.head || nodes.at(-1)!.id !== state.tail || nodes.length !== Object.keys(state.nodes).length) {
    throw new Error('All nodes must form exactly one cycle from HEAD, with TAIL.next pointing to HEAD.')
  }
  // Reuse numeric/identity/size validation only after opening the verified closing link.
  assertList(openCircularList(state))
}
function openCircularList(state: CircularState): ListState {
  const nodes = { ...copyList(state).nodes }
  if (state.tail !== null) nodes[state.tail] = { ...nodes[state.tail]!, next: null }
  return { head: state.head, nodes, nextId: state.nextId }
}
export function circularToSingly(state: CircularState): ListState {
  assertCircularList(state)
  return openCircularList(state)
}
export function toCircularList(state: ListState): CircularState {
  assertList(state)
  const ordered = listNodes(state)
  // Explicitly copy next/data/ID: a doubly list's prev fields never leak into this model.
  const nodes = Object.fromEntries(ordered.map(({ id, value, next }) => [id, { id, value, next }]))
  const tail = ordered.at(-1)?.id ?? null
  if (tail !== null) nodes[tail] = { ...nodes[tail], next: state.head }
  const result: CircularState = { type: 'circular', head: state.head, tail, nodes, nextId: state.nextId }
  assertCircularList(result)
  return result
}
export function createCircularList(values: readonly number[] = [10, 20, 30], nextId = 1) {
  return toCircularList(createList(values, nextId))
}
export function copyCircularList(state: CircularState): CircularState {
  return { ...state, nodes: Object.fromEntries(Object.values(state.nodes).map((node) => [node!.id, { ...node! }])) }
}
export function circularSummary(state: CircularState) {
  const { nodes, stoppedAt } = circularWalk(state)
  const ending = stoppedAt === null ? 'NULL' : stoppedAt === state.head ? 'HEAD (loop)' : `${stoppedAt} (temporary loop)`
  return [...nodes.map((node) => node.value), ending].join(' → ')
}
