import { expect, test } from 'vitest'
import { assertAVL, avlMetrics, balanceFactor, emptyAVL, rotationPresets, type AVLTree } from './avlModel'
import { createAVL, runAVLOperation } from './avlOperations'
import { createAVLTrace, createAVLTraversal } from './avlTrace'
import { avlCode } from './avlCode'
import { layoutBSTSnapshot } from '../bst/bstLayout'
import type { BSTOperation } from '../bst/bstContext'
import type { TreeNodeId } from '../treeModel'

/** Independent structural walk; does not use the implementation's height/BF helpers. */
function verify(tree: AVLTree, expected: readonly number[]) {
  const seen = new Set<TreeNodeId>()
  const values: number[] = []
  function walk(id: TreeNodeId | null, lower: number, upper: number): number {
    if (id === null) return 0
    expect(seen.has(id)).toBe(false); seen.add(id)
    const node = tree.nodes[id]!
    expect(node).toBeDefined(); expect(node.id).toBe(id)
    expect(node.value).toBeGreaterThan(lower); expect(node.value).toBeLessThan(upper)
    const left = walk(node.left, lower, node.value)
    values.push(node.value)
    const right = walk(node.right, node.value, upper)
    expect(node.height).toBe(1 + Math.max(left, right))
    expect(Math.abs(left - right)).toBeLessThanOrEqual(1)
    return 1 + Math.max(left, right)
  }
  walk(tree.root, -Infinity, Infinity)
  expect(values).toEqual([...expected].sort((a, b) => a - b))
  expect(seen.size).toBe(Object.keys(tree.nodes).length)
  assertAVL(tree)
}
function inspectTrace(tree: AVLTree, operation: BSTOperation) {
  const input = JSON.stringify(tree)
  const trace = createAVLTrace(tree, operation)
  expect(JSON.stringify(tree)).toBe(input)
  expect(trace).toEqual(createAVLTrace(tree, operation))
  const values = Object.values(tree.nodes).map((node) => node!.value)
  const expected = operation.kind === 'insert' ? [...values, operation.value] : operation.kind === 'delete' ? values.filter((value) => value !== operation.value) : values
  const final = trace.at(-1)!.tree
  verify(final, expected)
  for (const node of Object.values(tree.nodes)) {
    if (operation.kind === 'delete' && node!.value === operation.value) expect(final.nodes[node!.id]).toBeUndefined()
    else expect(final.nodes[node!.id]!.value).toBe(node!.value)
  }
  const ids = avlCode(operation.kind).map((line) => line.id)
  expect(Object.isFrozen(trace)).toBe(true)
  for (let index = 0; index < trace.length; index += 1) {
    const step = trace[index]
    expect(ids).toContain(step.lineId)
    expect(Object.isFrozen(step)).toBe(true)
    expect(Object.isFrozen(step.tree.nodes)).toBe(true)
    expect(Object.values(step.tree.nodes).every(Object.isFrozen)).toBe(true)
    expect(Object.isFrozen(step.metrics)).toBe(true)
    const forest = layoutBSTSnapshot(step.tree)
    const held = [...Object.values(step.locals), ...(step.rotation ? [step.rotation.root, step.rotation.pivot, step.rotation.transfer] : [])]
    for (const root of forest.roots) expect(held).toContain(root)
    for (const id of held) if (id !== null) expect(step.tree.nodes[id!]).toBeDefined()
    function actual(id: TreeNodeId | null): number {
      if (id === null) return 0
      const node = step.tree.nodes[id]!
      const left = actual(node.left), right = actual(node.right)
      expect(step.metrics[id]).toEqual({ height: node.height, actualHeight: 1 + Math.max(left, right), balance: left - right, pending: node.height !== 1 + Math.max(left, right) })
      return 1 + Math.max(left, right)
    }
    for (const id of Object.keys(step.tree.nodes) as TreeNodeId[]) actual(id)
    if (!index) continue
    const previous = trace[index - 1]
    if (step.pointer) {
      const { source, field, from, to } = step.pointer
      expect(source === 'ROOT' ? previous.tree.root : previous.tree.nodes[source]![field as 'left' | 'right']).toBe(from)
      const changed = source === 'ROOT' ? { ...previous.tree, root: to }
        : { ...previous.tree, nodes: { ...previous.tree.nodes, [source]: { ...previous.tree.nodes[source]!, [field]: to } } }
      expect(step.tree).toEqual(changed)
    } else if (step.heightUpdate) {
      const { id, from, to } = step.heightUpdate
      expect(previous.tree.nodes[id]!.height).toBe(from)
      expect(step.tree).toEqual({ ...previous.tree, nodes: { ...previous.tree.nodes, [id]: { ...previous.tree.nodes[id]!, height: to } } })
    } else if (step.kind !== 'allocate' && step.kind !== 'remove') expect(step.tree).toEqual(previous.tree)
    if (step.kind === 'balance') {
      expect(step.metrics[step.current!]!.pending).toBe(false)
      expect(balanceFactor(step.tree, step.current!)).toBe(step.metrics[step.current!]!.balance)
    }
  }
  return trace
}
const cases = Object.keys(rotationPresets) as (keyof typeof rotationPresets)[]
test.each(cases)('%s insertion rotates real nodes in the correct order', (which) => {
  const values = rotationPresets[which]
  const tree = createAVL(values.slice(0, 2))
  const trace = inspectTrace(tree, { kind: 'insert', value: values[2] })
  expect(trace.filter((step) => step.kind.startsWith('case-')).map((step) => step.imbalance!.case)).toEqual([which])
  expect(trace.filter((step) => step.kind === 'left-rotation' || step.kind === 'right-rotation').map((step) => step.rotation!.direction))
    .toEqual(which === 'LL' ? ['right'] : which === 'RR' ? ['left'] : which === 'LR' ? ['left', 'right'] : ['right', 'left'])
  const final = trace.at(-1)!.tree
  expect(final.nodes[final.root!]!.value).toBe(20)
  expect(final.nodes[final.root!]!.height).toBe(2)
  expect(trace.some((step) => Object.values(step.metrics).some((metric) => metric!.pending))).toBe(true)
})
test.each([[], [0], [-5, 0], [40, 20, 60, 10, 30, 50, 70]].map((values) => ({ values })))('insertion on $values handles empty and balanced trees', ({ values }) => {
  inspectTrace(createAVL(values), { kind: 'insert', value: -10 })
})
test('rotations retain a nonempty middle subtree and reconnect a non-root parent', () => {
  const trace = inspectTrace(createAVL([50, 30, 70, 20, 40, 60, 80, 10, 25]), { kind: 'insert', value: 5 })
  const rotation = trace.find((step) => step.kind === 'right-rotation')!.rotation!
  expect(rotation.parent).not.toBeNull(); expect(rotation.transfer).not.toBeNull()
  const moved = trace.find((step) => step.kind === 'rotation-transfer')!
  expect(moved.tree.nodes[rotation.root]!.left).toBe(rotation.transfer)
  const final = trace.at(-1)!.tree
  expect(final.nodes[rotation.parent!]!.left).toBe(rotation.pivot)
})
test.each([
  { name: 'empty', values: [], value: 0 }, { name: 'last node', values: [0], value: 0 },
  { name: 'leaf', values: [40, 20, 60], value: 20 },
  { name: 'one left child', values: [40, 20, 60, 10], value: 20 },
  { name: 'one right child', values: [40, 20, 60, 30], value: 20 },
  { name: 'root one child', values: [40, 20], value: 40 },
  { name: 'root two children', values: [40, 20, 60, 10, 30, 50, 70], value: 40 },
  { name: 'immediate successor and its child', values: [40, 20, 60, 10, 30, 70], value: 40 },
  { name: 'deep successor and its right child', values: [40, 20, 70, 10, 30, 50, 80, 25, 35, 60], value: 40 },
  { name: 'missing', values: [0, -5, 5], value: 4 },
])('deletion: $name', ({ values, value }) => { inspectTrace(createAVL(values), { kind: 'delete', value }) })
test.each([
  { which: 'LL', values: [30, 20, 40, 10], value: 40 },
  { which: 'RR', values: [20, 10, 30, 40], value: 10 },
  { which: 'LR', values: [30, 10, 40, 20], value: 40 },
  { which: 'RL', values: [20, 10, 40, 30], value: 10 },
  { which: 'LL', values: [30, 20, 40, 10, 25], value: 40, zero: true },
  { which: 'RR', values: [20, 10, 30, 25, 40], value: 10, zero: true },
])('deletion selects $which, zero-balanced child: $zero', ({ which, values, value, zero }) => {
  const trace = inspectTrace(createAVL(values), { kind: 'delete', value })
  const selected = trace.find((step) => step.kind.startsWith('case-'))!
  expect(selected.imbalance!.case).toBe(which)
  if (zero) expect(selected.imbalance!.childBalance).toBe(0)
})
test('duplicate, range, capacity, and malformed-height errors preserve input', () => {
  const tree = createAVL([0, -5, 5]), before = JSON.stringify(tree)
  expect(() => createAVLTrace(tree, { kind: 'insert', value: 0 })).toThrow(/Duplicate/)
  for (const value of [100, -100, 1.5, NaN, Infinity]) expect(() => createAVLTrace(tree, { kind: 'insert', value })).toThrow()
  expect(() => createAVLTrace(createAVL(Array.from({ length: 15 }, (_, i) => i)), { kind: 'insert', value: 20 })).toThrow(/full/)
  expect(() => assertAVL({ ...tree, nodes: { ...tree.nodes, t1: { ...tree.nodes.t1!, height: 99 } } })).toThrow(/height/)
  expect(JSON.stringify(tree)).toBe(before)
})
test('search and extrema reuse BST algorithms without mutations', () => {
  for (const values of [[], [0], [-5, 0, -10, 5, -7]]) {
    const tree = createAVL(values)
    for (const kind of ['minimum', 'maximum'] as const) {
      const trace = inspectTrace(tree, { kind }), last = trace.at(-1)!
      expect(last.outcome).toBe(values.length ? 'found' : 'empty')
      if (values.length) expect(last.tree.nodes[last.result!]!.value).toBe(kind === 'minimum' ? Math.min(...values) : Math.max(...values))
    }
    for (const value of [0, 3, -10]) {
      const trace = inspectTrace(tree, { kind: 'search', value })
      expect(trace.at(-1)!.outcome).toBe(values.includes(value) ? 'found' : 'missing')
      expect(trace.at(-1)!.tree).toEqual(tree)
    }
  }
})
test('all four traversals reuse current AVL references and retain height metadata', () => {
  const tree = createAVL([40, 20, 60, 10, 30, 50, 70])
  const expected = { preorder: [40, 20, 10, 30, 60, 50, 70], inorder: [10, 20, 30, 40, 50, 60, 70], postorder: [10, 30, 20, 50, 70, 60, 40], 'level-order': [40, 20, 60, 10, 30, 50, 70] }
  for (const kind of Object.keys(expected) as (keyof typeof expected)[]) {
    const trace = createAVLTraversal(tree, kind)
    expect(trace.at(-1)!.output.map((id) => tree.nodes[id]!.value)).toEqual(expected[kind])
    expect(trace.at(-1)!.tree).toEqual(tree)
    expect(Object.isFrozen(trace.at(-1)!.tree.nodes.t1)).toBe(true)
  }
})
test('deterministic insertion/deletion chains preserve every invariant, including multi-ancestor repairs', () => {
  let seed = 424242
  function random() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32 }
  let multiple: { values: number[]; value: number; cases: string[] } | null = null
  for (let example = 0; example < 120; example += 1) {
    const values = Array.from({ length: 15 }, (_, i) => i - 7)
    for (let i = values.length - 1; i > 0; i -= 1) { const j = Math.floor(random() * (i + 1)); [values[i], values[j]] = [values[j], values[i]] }
    let tree = emptyAVL()
    const present: number[] = []
    for (const value of values) { tree = runAVLOperation(tree, { kind: 'insert', value }); present.push(value); verify(tree, present) }
    for (const value of values) {
      const old = tree
      const trace = createAVLTrace(tree, { kind: 'delete', value })
      const repairs = trace.filter((step) => step.kind.startsWith('case-'))
      if (repairs.length > 1 && multiple === null) {
        inspectTrace(old, { kind: 'delete', value })
        multiple = { values, value, cases: repairs.map((step) => step.kind) }
      }
      tree = trace.at(-1)!.tree
      present.splice(present.indexOf(value), 1); verify(tree, present)
      for (const node of Object.values(old.nodes)) if (node!.value !== value) expect(tree.nodes[node!.id]!.value).toBe(node!.value)
    }
    expect(tree.root).toBeNull(); expect(tree.nextId).toBe(16)
  }
  expect(multiple).not.toBeNull()
})
test('empty metrics and height helpers follow the documented convention', () => {
  expect(avlMetrics(emptyAVL())).toEqual({})
  const tree = createAVL([0])
  expect(tree.nodes.t1!.height).toBe(1); expect(balanceFactor(tree, 't1')).toBe(0)
})

