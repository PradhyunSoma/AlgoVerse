export type TreeNodeId = `t${number}`
export interface TreeNode {
  readonly id: TreeNodeId
  readonly value: number
  readonly left: TreeNodeId | null
  readonly right: TreeNodeId | null
}
export interface BinaryTree {
  readonly root: TreeNodeId | null
  readonly nodes: Readonly<Partial<Record<TreeNodeId, TreeNode>>>
  readonly nextId: number
}
export const MAX_TREE_NODES = 15
export const MAX_TREE_VALUE = 99
export const EXAMPLE_TREE_INPUT = '1, 2, 3, 4, 5, null, 6'

export function assertTree(tree: BinaryTree) {
  const ids = Object.keys(tree.nodes)
  if (ids.length > MAX_TREE_NODES) throw new RangeError(`Use at most ${MAX_TREE_NODES} nodes.`)
  if (!Number.isSafeInteger(tree.nextId) || tree.nextId < 1) throw new Error('Invalid node ID counter.')
  const seen = new Set<TreeNodeId>()
  function inspect(id: TreeNodeId | null) {
    if (id === null) return
    if (seen.has(id)) throw new Error('A tree cannot contain cycles or nodes with multiple parents.')
    const node = tree.nodes[id]
    if (!node || node.id !== id) throw new Error('A child reference points to a missing node.')
    if (!/^t[1-9]\d*$/.test(id) || Number(id.slice(1)) >= tree.nextId) throw new Error('Invalid node identity.')
    if (!Number.isInteger(node.value) || Math.abs(node.value) > MAX_TREE_VALUE) throw new RangeError('Values must be integers from -99 to 99.')
    seen.add(id)
    inspect(node.left)
    inspect(node.right)
  }
  inspect(tree.root)
  if (seen.size !== ids.length) throw new Error('Every node must be reachable from ROOT.')
}

/** Queue-based level order: only non-null parents consume child pairs. */
export function parseTreeInput(text: string, nextId = 1): BinaryTree {
  if (text.length > 1000) throw new RangeError('Input is too long. Use at most 15 nodes.')
  const tokens = text.trim() === '' ? [] : text.split(',').map((token) => token.trim())
  if (tokens.length > MAX_TREE_NODES * 2 + 1) throw new RangeError('Use at most 31 level-order entries and 15 numeric nodes.')
  const values = tokens.map((token) => {
    if (token.toLowerCase() === 'null') return null
    if (!/^-?\d+$/.test(token)) throw new RangeError('Use comma-separated integers or null. Empty entries and trailing commas are not allowed.')
    const value = Number(token)
    if (Math.abs(value) > MAX_TREE_VALUE) throw new RangeError('Values must be integers from -99 to 99.')
    return value
  })
  if (values.filter((value) => value !== null).length > MAX_TREE_NODES) throw new RangeError('Use at most 15 nodes.')
  const nodes: Partial<Record<TreeNodeId, TreeNode>> = {}
  function allocate(value: number | null | undefined): TreeNodeId | null {
    if (value === null || value === undefined) return null
    const id: TreeNodeId = `t${nextId++}`
    nodes[id] = { id, value, left: null, right: null }
    return id
  }
  const root = allocate(values[0])
  const parents = root === null ? [] : [root]
  let cursor = values.length ? 1 : 0
  for (let parentIndex = 0; parentIndex < parents.length && cursor < values.length; parentIndex += 1) {
    const id = parents[parentIndex]
    const left = allocate(values[cursor++])
    const right = cursor < values.length ? allocate(values[cursor++]) : null
    nodes[id] = { ...nodes[id]!, left, right }
    if (left !== null) parents.push(left)
    if (right !== null) parents.push(right)
  }
  if (cursor < values.length) throw new RangeError(`Entry ${cursor + 1} is unreachable: no parent has a remaining child slot. Remove extra entries, including extra nulls.`)
  const tree = { root, nodes, nextId }
  assertTree(tree)
  return tree
}

/** Traversals never edit topology; a trace can safely share this immutable private copy. */
export function immutableTree(tree: BinaryTree): BinaryTree {
  assertTree(tree)
  const nodes = Object.fromEntries(Object.values(tree.nodes).map((node) => [node!.id, Object.freeze({ ...node! })]))
  return Object.freeze({ ...tree, nodes: Object.freeze(nodes) })
}
