import { assertTree, type BinaryTree, type TreeNodeId } from './treeModel'

export const traversalLabels = { preorder: 'Preorder', inorder: 'Inorder', postorder: 'Postorder', 'level-order': 'Level-order' } as const
export type TraversalKind = keyof typeof traversalLabels
export type TreeEventKind = 'start' | 'enter' | 'base-check' | 'base-return' | 'call-left' | 'resume-left' | 'visit'
  | 'call-right' | 'resume-right' | 'return' | 'queue-init' | 'queue-check' | 'dequeue' | 'enqueue-left' | 'enqueue-right' | 'processed' | 'complete'
export interface TreeFrame {
  readonly callId: string
  readonly nodeId: TreeNodeId | null
  readonly parentId: TreeNodeId | null
  readonly via: 'root' | 'left' | 'right'
}
export interface TreeTransition { readonly source: TreeNodeId; readonly side: 'left' | 'right'; readonly target: TreeNodeId | null }
export interface TreeEvent {
  readonly kind: TreeEventKind
  readonly current: TreeNodeId | null
  readonly stack: readonly TreeFrame[]
  readonly queue: readonly TreeNodeId[]
  readonly output: readonly TreeNodeId[]
  readonly completed: readonly TreeNodeId[]
  readonly transition: TreeTransition | null
  readonly explanation: string
}

/** Algorithm events are synchronous and independent of React, rendering, and timers. */
export function traverseTree(tree: BinaryTree, traversal: TraversalKind, observe?: (event: TreeEvent) => void): readonly TreeNodeId[] {
  assertTree(tree)
  const stack: TreeFrame[] = []
  const queue = new Map<number, TreeNodeId>()
  let front = 0
  let back = 0
  const enqueue = (id: TreeNodeId) => queue.set(back++, id)
  const output: TreeNodeId[] = []
  const completed: TreeNodeId[] = []
  let current: TreeNodeId | null = null
  const label = (id: TreeNodeId | null): string => id === null ? 'NULL' : `${tree.nodes[id]!.value} (${id})`
  function emit(kind: TreeEventKind, explanation: string, transition: TreeTransition | null = null) {
    observe?.({ kind, current, stack, queue: [...queue.values()], output, completed, transition, explanation })
  }
  function visit(id: TreeNodeId) {
    output.push(id)
    emit('visit', `Visit ${label(id)}: append its value to the output. Entering a call and visiting its node are different actions.`)
  }
  emit('start', `Start ${traversalLabels[traversal]} from ROOT → ${label(tree.root)}. The tree stays unchanged throughout traversal.`)
  if (traversal === 'level-order') {
    if (tree.root !== null) enqueue(tree.root)
    emit('queue-init', tree.root === null ? 'ROOT is NULL. Initialize an empty queue.' : `Initialize the queue with ROOT ${label(tree.root)} at the front.`)
    while (true) {
      current = null
      emit('queue-check', queue.size > 0 ? `The queue contains ${queue.size} waiting node(s). Process its front next.` : 'The queue is empty. No nodes remain to process.')
      if (queue.size === 0) break
      current = queue.get(front)!
      queue.delete(front++)
      const node = tree.nodes[current]!
      emit('dequeue', `Remove ${label(current)} from the front of the queue. It is current, but has not been visited yet.`)
      visit(current)
      for (const side of ['left', 'right'] as const) {
        const child = node[side]
        if (child !== null) enqueue(child)
        emit(side === 'left' ? 'enqueue-left' : 'enqueue-right', child === null
          ? `${label(current)} has no ${side} child. Enqueue nothing.`
          : `Enqueue ${side} child ${label(child)} at the back. Left children are enqueued before right children.`, { source: current, side, target: child })
      }
      completed.push(current)
      emit('processed', `Finished processing ${label(current)} and checking its children. Its descendants may still be waiting in the queue.`)
    }
  } else {
    function walk(id: TreeNodeId | null, parentId: TreeNodeId | null, via: TreeFrame['via'], callId: string) {
      current = id
      stack.push({ callId, nodeId: id, parentId, via })
      emit('enter', `Enter traverse(${label(id)}) through ${via === 'root' ? 'ROOT' : `the ${via} child of ${label(parentId)}`}. Push this call onto the stack; do not append output yet.`)
      emit('base-check', id === null ? 'This call received NULL. It is a base case and returns without visiting a node.' : `${label(id)} is not NULL. Continue this recursive call.`)
      if (id === null) {
        emit('base-return', 'Return from the NULL call without changing the output. The caller resumes next.')
        stack.pop()
        return
      }
      const node = tree.nodes[id]!
      if (traversal === 'preorder') visit(id)
      for (const side of ['left', 'right'] as const) {
        emit(side === 'left' ? 'call-left' : 'call-right', `Call traverse on the ${side} child ${label(node[side])} of ${label(id)}. This parent call waits.`, { source: id, side, target: node[side] })
        walk(node[side], id, side, `${callId}.${side === 'left' ? 'L' : 'R'}`)
        current = id
        emit(side === 'left' ? 'resume-left' : 'resume-right', `The ${side} subtree of ${label(id)} has returned. Resume this parent call; this step does not visit it again.`, { source: id, side, target: node[side] })
        if (side === 'left' && traversal === 'inorder') visit(id)
      }
      if (traversal === 'postorder') visit(id)
      completed.push(id)
      emit('return', `Return from ${label(id)}${parentId === null ? ' to the traversal driver' : ` to parent ${label(parentId)}`}. Its entire subtree is complete. The exiting frame is shown until the next step.`)
      stack.pop()
    }
    walk(tree.root, null, 'root', 'ROOT')
  }
  current = null
  emit('complete', `Traversal complete. ${output.length ? `Output: ${output.map((id) => tree.nodes[id]!.value).join(' → ')}.` : 'The tree is empty; no values were visited.'}`)
  return [...output]
}
