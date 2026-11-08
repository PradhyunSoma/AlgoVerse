import { assertTree, immutableTree, MAX_TREE_NODES, MAX_TREE_VALUE, type BinaryTree, type TreeNodeId, type TreeNode } from '../treeModel'
export const BST_SAMPLE = [40, 20, 60, 10, 30, 50, 70] as const
export function assertBST(tree: BinaryTree) {
  assertTree(tree)
  function inspect(id: TreeNodeId | null, lower: number, upper: number) {
    if (id === null) return
    const node = tree.nodes[id]!
    if (node.value <= lower || node.value >= upper) throw new Error('BST ordering requires every left value to be smaller and every right value to be greater; duplicates are not allowed.')
    inspect(node.left, lower, node.value)
    inspect(node.right, node.value, upper)
  }
  inspect(tree.root, -Infinity, Infinity)
}
export function assertBSTValue(value: number) {
  if (!Number.isInteger(value) || Math.abs(value) > MAX_TREE_VALUE) throw new RangeError('Use a whole number from -99 to 99.')
}
export function parseBSTValue(text: string) {
  if (!/^-?\d+$/.test(text.trim())) throw new RangeError('Enter a whole number from -99 to 99.')
  const value = Number(text)
  assertBSTValue(value)
  return value
}
/** Sequential insertion for initial examples; interactive insertion records its own trace. */
export function createBST(values: readonly number[] = BST_SAMPLE, nextId = 1): BinaryTree {
  if (values.length > MAX_TREE_NODES) throw new RangeError(`Use at most ${MAX_TREE_NODES} nodes.`)
  const nodes: Partial<Record<TreeNodeId, TreeNode>> = {}
  let root: TreeNodeId | null = null
  for (const value of values) {
    assertBSTValue(value)
    let current = root
    let parent: TreeNodeId | null = null
    let side: 'left' | 'right' = 'left'
    while (current !== null) {
      const node = nodes[current]!
      if (value === node.value) throw new RangeError(`${value} already exists. Duplicate insertions are not allowed.`)
      parent = current
      side = value < node.value ? 'left' : 'right'
      current = node[side]
    }
    const id: TreeNodeId = `t${nextId++}`
    nodes[id] = { id, value, left: null, right: null }
    if (parent === null) root = id
    else nodes[parent] = { ...nodes[parent]!, [side]: id }
  }
  const tree = { root, nodes, nextId }
  assertBST(tree)
  return immutableTree(tree)
}
export function bstValues(tree: BinaryTree): number[] {
  assertBST(tree)
  function walk(id: TreeNodeId | null): number[] {
    return id === null ? [] : [...walk(tree.nodes[id]!.left), tree.nodes[id]!.value, ...walk(tree.nodes[id]!.right)]
  }
  return walk(tree.root)
}
