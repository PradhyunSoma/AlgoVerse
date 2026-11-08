import { expect, test } from 'vitest'
import { assertTree, EXAMPLE_TREE_INPUT, immutableTree, parseTreeInput, type BinaryTree } from './treeModel'
import { layoutTree } from './treeLayout'

test('parses the example as explicit left/right references, without BST ordering', () => {
  const tree = parseTreeInput(EXAMPLE_TREE_INPUT)
  expect(tree.root).toBe('t1')
  expect(tree.nodes).toEqual({
    t1: { id: 't1', value: 1, left: 't2', right: 't3' }, t2: { id: 't2', value: 2, left: 't4', right: 't5' },
    t3: { id: 't3', value: 3, left: null, right: 't6' }, t4: { id: 't4', value: 4, left: null, right: null },
    t5: { id: 't5', value: 5, left: null, right: null }, t6: { id: 't6', value: 6, left: null, right: null },
  })
})
test.each(['', ' ', 'null', 'NULL'])('accepts an empty tree: %j', (text) => {
  expect(parseTreeInput(text)).toEqual({ root: null, nodes: {}, nextId: 1 })
})
test('NULL consumes a child slot but not a parent slot; IDs count actual nodes', () => {
  const tree = parseTreeInput('1, null, -2, -2', 10)
  expect(tree.nodes.t10).toEqual({ id: 't10', value: 1, left: null, right: 't11' })
  expect(tree.nodes.t11).toEqual({ id: 't11', value: -2, left: 't12', right: null })
  expect(tree.nextId).toBe(13)
  expect(parseTreeInput('1')).toEqual(parseTreeInput('1, null, null'))
})
test.each(['1,', ',1', '1,,2', '1, foo', '1.2', '1e2', 'Infinity', 'NaN', '100', '-100', 'null, 1', 'null, null', '1, null, null, 2', '1, null, null, null', Array(16).fill(1).join(',')])('rejects malformed/unreachable/oversize input: %s', (text) => {
  expect(() => parseTreeInput(text)).toThrow()
})
test('accepts full and maximally skewed 15-node trees', () => {
  expect(Object.keys(parseTreeInput(Array(15).fill(-99).join(',')).nodes)).toHaveLength(15)
  const skewed = parseTreeInput(Array.from({ length: 15 }, (_, index) => index === 0 ? '0' : `null, ${index}`).join(', '))
  expect(Object.keys(skewed.nodes)).toHaveLength(15)
  expect(layoutTree(skewed).treeHeight).toBe(14)
})
test('rejects cycles, multiple parents, dangling references, invalid values, and unreachable nodes', () => {
  const tree = parseTreeInput('1, 2, 3')
  const invalid: BinaryTree[] = [
    { ...tree, root: null }, { ...tree, root: 't8' }, { ...tree, nextId: 1 },
    { ...tree, nodes: { ...tree.nodes, t2: { ...tree.nodes.t2!, left: 't1' } } },
    { ...tree, nodes: { ...tree.nodes, t1: { ...tree.nodes.t1!, right: 't2' } } },
    { ...tree, nodes: { ...tree.nodes, t2: { ...tree.nodes.t2!, right: 't9' } } },
    { ...tree, nodes: { ...tree.nodes, t2: { ...tree.nodes.t2!, id: 't3' } } },
    { ...tree, nodes: { ...tree.nodes, t2: { ...tree.nodes.t2!, value: 100 } } },
  ]
  for (const state of invalid) expect(() => assertTree(state)).toThrow()
})
test('private immutable copy preserves input and has frozen nodes', () => {
  const tree = parseTreeInput('1, -2, -2')
  const copy = immutableTree(tree)
  expect(copy).toEqual(tree)
  expect(copy).not.toBe(tree)
  expect(copy.nodes.t1).not.toBe(tree.nodes.t1)
  expect(Object.isFrozen(tree)).toBe(false)
  expect(Object.isFrozen(copy)).toBe(true)
  expect(Object.isFrozen(copy.nodes)).toBe(true)
  expect(Object.values(copy.nodes).every(Object.isFrozen)).toBe(true)
})
test.each(['', '1', EXAMPLE_TREE_INPUT, '1, 2, null, 3, null, 4', '1, null, 2, null, 3, null, 4', Array(15).fill(1).join(',')])('layout keeps branches ordered, spaced, bounded, and deterministic: %s', (input) => {
  const tree = parseTreeInput(input)
  const layout = layoutTree(tree)
  expect(layout).toEqual(layoutTree(tree))
  for (const point of layout.positions) {
    expect(point.x).toBeGreaterThanOrEqual(38)
    expect(point.x + 38).toBeLessThanOrEqual(layout.width)
    expect(point.y + 84).toBeLessThanOrEqual(layout.height)
    for (const other of layout.positions) if (point.id !== other.id && point.depth === other.depth) expect(Math.abs(point.x - other.x)).toBeGreaterThanOrEqual(108)
    for (const side of ['left', 'right'] as const) {
      const id = tree.nodes[point.id]![side]
      if (id === null) continue
      const child = layout.positions.find((position) => position.id === id)!
      expect(child.depth).toBe(point.depth + 1)
      expect(child.y - point.y).toBe(140)
      expect(side === 'left' ? child.x < point.x : child.x > point.x).toBe(true)
    }
  }
})
