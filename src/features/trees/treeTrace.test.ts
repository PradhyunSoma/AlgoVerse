import { expect, test } from 'vitest'
import { EXAMPLE_TREE_INPUT, immutableTree, parseTreeInput, type BinaryTree, type TreeNodeId } from './treeModel'
import { createTreeTrace } from './treeTrace'
import { traversalLabels, traverseTree, type TraversalKind } from './treeTraversals'
import { treeCode } from './treeCode'
const kinds = Object.keys(traversalLabels) as TraversalKind[]
const expectedExample = { preorder: [1, 2, 4, 5, 3, 6], inorder: [4, 2, 5, 1, 3, 6], postorder: [4, 5, 2, 6, 3, 1], 'level-order': [1, 2, 3, 4, 5, 6] }

/** Independent traversal oracle, using recursive concatenation or arrays of levels. */
function expectedIds(tree: BinaryTree, kind: TraversalKind): TreeNodeId[] {
  if (kind === 'level-order') {
    let level = tree.root === null ? [] : [tree.root]
    const result: TreeNodeId[] = []
    while (level.length) {
      result.push(...level)
      level = level.flatMap((id) => [tree.nodes[id]!.left, tree.nodes[id]!.right].filter((child): child is TreeNodeId => child !== null))
    }
    return result
  }
  const walk = (id: TreeNodeId | null): TreeNodeId[] => id === null ? [] : kind === 'preorder' ? [id, ...walk(tree.nodes[id]!.left), ...walk(tree.nodes[id]!.right)]
    : kind === 'inorder' ? [...walk(tree.nodes[id]!.left), id, ...walk(tree.nodes[id]!.right)] : [...walk(tree.nodes[id]!.left), ...walk(tree.nodes[id]!.right), id]
  return walk(tree.root)
}
test.each(kinds)('%s has the required example output', (kind) => {
  const tree = parseTreeInput(EXAMPLE_TREE_INPUT)
  expect(createTreeTrace(tree, kind).at(-1)!.output.map((id) => tree.nodes[id]!.value)).toEqual(expectedExample[kind])
})
test.each(['', '5', '1,2,3,4,5,6,7', '1,2,null,3,null,4', '1,null,2,null,3,null,4', '1,null,2,3,null,null,4', '-2,-2,3,null,-5', Array(15).fill(1).join(',')])('all traversals preserve input and visit each node exactly once: %s', (input) => {
  const tree = immutableTree(parseTreeInput(input))
  const original = JSON.stringify(tree)
  for (const kind of kinds) {
    const trace = createTreeTrace(tree, kind)
    expect(trace).toEqual(createTreeTrace(tree, kind))
    expect(traverseTree(tree, kind)).toEqual(expectedIds(tree, kind))
    expect(trace.at(-1)!.output).toEqual(expectedIds(tree, kind))
    expect(new Set(trace.at(-1)!.output).size).toBe(Object.keys(tree.nodes).length)
    expect(trace.at(-1)!.stack).toEqual([])
    expect(trace.at(-1)!.queue).toEqual([])
    expect([...trace.at(-1)!.completed].sort()).toEqual(Object.keys(tree.nodes).sort())
    expect(Object.isFrozen(trace)).toBe(true)
    const code = treeCode(kind)
    expect(new Set(code.map((line) => line.id)).size).toBe(code.length)
    trace.forEach((step, index) => {
      expect(step.tree).toEqual(tree)
      expect(Object.isFrozen(step)).toBe(true)
      expect(Object.isFrozen(step.output)).toBe(true)
      expect(code.map((line) => line.id)).toContain(step.lineId)
      if (index) {
        expect(step.output.length - trace[index - 1].output.length).toBe(step.kind === 'visit' ? 1 : 0)
        expect(step.output).not.toBe(trace[index - 1].output)
      }
      if (step.kind === 'visit') expect(step.output.at(-1)).toBe(step.current)
      if (step.transition) expect(tree.nodes[step.transition.source]![step.transition.side]).toBe(step.transition.target)
    })
  }
  expect(JSON.stringify(tree)).toBe(original)
})
test.each(['preorder', 'inorder', 'postorder'] as const)('%s records real recursive calls, NULL base cases, returns, and completed subtrees', (kind) => {
  const tree = parseTreeInput(EXAMPLE_TREE_INPUT)
  const trace = createTreeTrace(tree, kind)
  const calls: (TreeNodeId | null)[] = []
  for (let index = 0; index < trace.length; index += 1) {
    const step = trace[index]
    if (step.kind === 'enter') calls.push(step.current)
    expect(step.stack.map((frame) => frame.nodeId)).toEqual(calls)
    if (step.stack.length) expect(step.current).toBe(step.stack.at(-1)!.nodeId)
    for (let frame = 1; frame < step.stack.length; frame += 1) {
      const parent = step.stack[frame - 1].nodeId!
      const child = step.stack[frame]
      expect(child.parentId).toBe(parent)
      expect(tree.nodes[parent]![child.via as 'left' | 'right']).toBe(child.nodeId)
    }
    if (step.kind === 'call-left' || step.kind === 'call-right') {
      expect(trace[index + 1].kind).toBe('enter')
      expect(trace[index + 1].current).toBe(step.transition!.target)
    }
    if (step.kind === 'base-return') expect(step.current).toBeNull()
    if (step.kind === 'return') {
      const subtree = { ...tree, root: step.current }
      for (const id of expectedIds(subtree, 'preorder')) expect(step.completed).toContain(id)
    }
    if (step.kind === 'return' || step.kind === 'base-return') calls.pop()
  }
  expect(trace.filter((step) => step.kind === 'base-return')).toHaveLength(7)
  expect(trace.filter((step) => step.kind === 'enter').map((step) => step.current).filter(Boolean)).toEqual(expectedIds(tree, 'preorder'))
})
test('BFS enqueues left before right and dequeues exactly the oldest waiting node', () => {
  const tree = parseTreeInput(EXAMPLE_TREE_INPUT)
  const queue: TreeNodeId[] = []
  for (const step of createTreeTrace(tree, 'level-order')) {
    if (step.kind === 'queue-init') queue.push(tree.root!)
    if (step.kind === 'dequeue') expect(queue.shift()).toBe(step.current)
    if ((step.kind === 'enqueue-left' || step.kind === 'enqueue-right') && step.transition!.target) queue.push(step.transition!.target)
    expect(step.queue).toEqual(queue)
    expect(step.stack).toEqual([])
    if (step.kind === 'processed') {
      expect(step.completed).toContain(step.current)
      for (const child of [tree.nodes[step.current!]!.left, tree.nodes[step.current!]!.right]) if (child !== null) expect(step.completed).not.toContain(child)
    }
  }
})
