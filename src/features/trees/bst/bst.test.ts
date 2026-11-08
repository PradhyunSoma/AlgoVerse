import { expect, test } from 'vitest'
import { assertBST, bstValues, createBST, parseBSTValue } from './bstModel'
import { createBSTTrace } from './bstTrace'
import { layoutBSTSnapshot } from './bstLayout'
import { bstCode } from './bstCode'
import type { BSTOperation } from './bstContext'
import { parseTreeInput, type BinaryTree, type TreeNodeId } from '../treeModel'
import { createTreeTrace } from '../treeTrace'

function verify(tree: BinaryTree, values: readonly number[]) {
  const seen = new Set<TreeNodeId>()
  const output: number[] = []
  function visit(id: TreeNodeId | null, min: number, max: number) {
    if (id === null) return
    expect(seen.has(id)).toBe(false)
    seen.add(id)
    const node = tree.nodes[id]!
    expect(node).toBeDefined(); expect(node.id).toBe(id)
    expect(node.value).toBeGreaterThan(min); expect(node.value).toBeLessThan(max)
    visit(node.left, min, node.value); output.push(node.value); visit(node.right, node.value, max)
  }
  visit(tree.root, -Infinity, Infinity)
  expect(output).toEqual([...values].sort((a, b) => a - b))
  expect(seen.size).toBe(Object.keys(tree.nodes).length)
  expect(seen.size).toBe(values.length)
  assertBST(tree)
}
function exercise(values: readonly number[], operation: BSTOperation) {
  const tree = createBST(values)
  const before = JSON.stringify(tree)
  const trace = createBSTTrace(tree, operation)
  const expected = operation.kind === 'insert' ? [...values, operation.value] : operation.kind === 'delete' ? values.filter((value) => value !== operation.value) : values
  const final = trace.at(-1)!.tree
  verify(final, expected)
  expect(JSON.stringify(tree)).toBe(before)
  expect(trace).toEqual(createBSTTrace(tree, operation))
  expect(Object.isFrozen(trace)).toBe(true)
  for (const original of Object.values(tree.nodes)) {
    if (operation.kind === 'delete' && original!.value === operation.value) expect(final.nodes[original!.id]).toBeUndefined()
    else expect(final.nodes[original!.id]!.value).toBe(original!.value)
  }
  const codeIds = bstCode(operation.kind).map((line) => line.id)
  for (let i = 0; i < trace.length; i += 1) {
    const step = trace[i]
    expect(codeIds).toContain(step.lineId)
    expect(Object.isFrozen(step)).toBe(true)
    expect(Object.isFrozen(step.tree.nodes)).toBe(true)
    expect(Object.values(step.tree.nodes).every(Object.isFrozen)).toBe(true)
    const forest = layoutBSTSnapshot(step.tree)
    // Independent reachability: every allocated component is either ROOT or a local held reference.
    const held = Object.values(step.locals)
    for (const root of forest.roots) expect(held).toContain(root)
    for (const ref of held) if (ref !== null) expect(step.tree.nodes[ref!]).toBeDefined()
    expect(forest.layout.positions).toHaveLength(Object.keys(step.tree.nodes).length)
    if (!i) continue
    const previous = trace[i - 1]
    if (step.pointer) {
      const { source, field, from, to } = step.pointer
      const old = source === 'ROOT' ? previous.tree.root : previous.tree.nodes[source]![field as 'left' | 'right']
      expect(old).toBe(from)
      const changed = source === 'ROOT' ? { ...previous.tree, root: to }
        : { ...previous.tree, nodes: { ...previous.tree.nodes, [source]: { ...previous.tree.nodes[source]!, [field]: to } } }
      expect(step.tree).toEqual(changed)
    } else if (step.kind !== 'allocate' && step.kind !== 'remove') expect(step.tree).toEqual(previous.tree)
  }
  return trace
}

test.each([
  { values: [], value: 0 }, { values: [0], value: -1 }, { values: [0], value: 1 },
  { values: [40, 20, 60, 30], value: 25 }, { values: [-5, -10, 0], value: -3 },
])('inserts $value into $values without mutating existing node identities', ({ values, value }) => { exercise(values, { kind: 'insert', value }) })
test('insertion follows the specified comparison path and allocates before connecting', () => {
  const trace = exercise([40, 20, 60, 30], { kind: 'insert', value: 25 })
  expect(trace.filter((step) => step.kind === 'compare').map((step) => step.tree.nodes[step.current!]!.value)).toEqual([40, 20, 30])
  expect(trace.filter((step) => step.kind.startsWith('move')).map((step) => step.kind)).toEqual(['move-left', 'move-right', 'move-left'])
  const allocated = trace.find((step) => step.kind === 'allocate')!
  expect(layoutBSTSnapshot(allocated.tree).detached).toEqual([allocated.newId])
  const final = trace.at(-1)!.tree
  expect(final.nodes.t4!.left).toBe('t5')
})
test.each([
  { values: [], value: 4 }, { values: [4], value: 4 }, { values: [4], value: -4 },
  { values: [40, 20, 60, 10, 30, 50, 70], value: 30 }, { values: [0, -5, 3], value: -5 },
])('searches for $value in $values', ({ values, value }) => {
  const trace = exercise(values, { kind: 'search', value })
  expect(trace.at(-1)!.outcome).toBe(values.includes(value) ? 'found' : 'missing')
  const result = trace.at(-1)!.result
  expect(result === null ? null : trace.at(-1)!.tree.nodes[result]!.value).toBe(values.includes(value) ? value : null)
})
const deletionCases = [
  { name: 'empty', values: [], value: 0 }, { name: 'last node', values: [0], value: 0 },
  { name: 'leaf', values: [40, 20, 60, 10, 30], value: 10 },
  { name: 'left child', values: [40, 20, 60, 10, 5], value: 20 },
  { name: 'right child', values: [40, 20, 60, 30, 35], value: 20 },
  { name: 'root with left subtree', values: [40, 20, 10, 30], value: 40 },
  { name: 'root with right subtree', values: [40, 60, 50, 70], value: 40 },
  { name: 'root two children', values: [40, 20, 60, 10, 30, 50, 70], value: 40 },
  { name: 'successor immediate leaf', values: [40, 20, 60], value: 40 },
  { name: 'successor immediate with right subtree', values: [40, 20, 60, 70, 65, 80], value: 40 },
  { name: 'successor deep with right subtree', values: [40, 20, 70, 60, 80, 50, 65, 55, 57], value: 40 },
  { name: 'internal two children', values: [80, 40, 90, 20, 70, 60, 75, 50, 55], value: 40 },
  { name: 'missing', values: [0, -5, 5], value: 4 },
]
test.each(deletionCases)('deletes correctly: $name', ({ values, value }) => { exercise(values, { kind: 'delete', value }) })
test('transplants the exact successor ID and retains its right subtree', () => {
  const trace = exercise([40, 20, 70, 60, 80, 50, 65, 55, 57], { kind: 'delete', value: 40 })
  const final = trace.at(-1)!.tree
  expect(final.root).toBe('t6') // 50 moves; no value copying.
  expect(final.nodes.t4!.left).toBe('t8') // 60.left = 55
  expect(final.nodes.t8!.right).toBe('t9') // 55.right = 57 preserved
  expect(final.nodes.t6!.left).toBe('t2'); expect(final.nodes.t6!.right).toBe('t3')
  expect(trace.filter((step) => step.pointer).map((step) => step.kind)).toEqual([
    'detach-successor-child', 'bypass-successor', 'detach-right', 'detach-left', 'transplant', 'attach-left', 'attach-right',
  ])
})
test.each(['minimum', 'maximum'] as const)('%s handles empty, singleton, balanced, and negative BSTs', (kind) => {
  for (const values of [[], [0], [40, 20, 60, 10, 30, 50, 70], [-5, -10, 0, -7]]) {
    const trace = exercise(values, { kind })
    const last = trace.at(-1)!
    expect(last.outcome).toBe(values.length ? 'found' : 'empty')
    if (last.result !== null) expect(last.tree.nodes[last.result]!.value).toBe(kind === 'minimum' ? Math.min(...values) : Math.max(...values))
  }
})
test('rejects duplicates, full trees, invalid values, and non-BST inputs', () => {
  const tree = createBST([0, -5, 5])
  const before = JSON.stringify(tree)
  expect(() => createBSTTrace(tree, { kind: 'insert', value: -5 })).toThrow(/Duplicate/)
  expect(() => createBST([1, 1])).toThrow(/Duplicate/)
  for (const value of [-100, 100, 1.2, NaN, Infinity]) expect(() => createBSTTrace(tree, { kind: 'insert', value })).toThrow()
  for (const value of ['', '1.2', 'NaN', '100', '1e1']) expect(() => parseBSTValue(value)).toThrow()
  expect(() => createBSTTrace(createBST(Array.from({ length: 15 }, (_, i) => i)), { kind: 'insert', value: 20 })).toThrow(/full/)
  for (const input of ['1, 2, 3', '40,20,60,null,50', '40,20,60,null,null,30', '1,1']) expect(() => assertBST(parseTreeInput(input))).toThrow()
  expect(JSON.stringify(tree)).toBe(before)
})
test('all four shared traversals work on the current BST and inorder is sorted', () => {
  const tree = createBST()
  const expected = { preorder: [40, 20, 10, 30, 60, 50, 70], inorder: [10, 20, 30, 40, 50, 60, 70], postorder: [10, 30, 20, 50, 70, 60, 40], 'level-order': [40, 20, 60, 10, 30, 50, 70] }
  for (const kind of Object.keys(expected) as (keyof typeof expected)[]) expect(createTreeTrace(tree, kind).at(-1)!.output.map((id) => tree.nodes[id]!.value)).toEqual(expected[kind])
})
test('repeated insertions and deletions chain with monotonic IDs and correct order', () => {
  let tree = createBST([])
  for (const value of [0, -20, 40, 20, 60, 10, 30, 25]) tree = createBSTTrace(tree, { kind: 'insert', value }).at(-1)!.tree
  for (const value of [40, 0, 10, 25, -20, 60, 20, 30]) {
    const prior = bstValues(tree)
    tree = createBSTTrace(tree, { kind: 'delete', value }).at(-1)!.tree
    verify(tree, prior.filter((entry) => entry !== value))
  }
  expect(tree.root).toBeNull(); expect(tree.nextId).toBe(9)
  tree = createBSTTrace(tree, { kind: 'insert', value: 0 }).at(-1)!.tree
  expect(tree.root).toBe('t9')
})
