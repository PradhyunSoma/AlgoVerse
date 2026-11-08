import { assertTree, type BinaryTree, type TreeNodeId } from './treeModel'
export interface TreePosition { readonly id: TreeNodeId; readonly x: number; readonly y: number; readonly depth: number }
/** Inorder ranks reserve distinct columns; subtree intervals never overlap. */
export function layoutTree(tree: BinaryTree) {
  assertTree(tree)
  const positions: TreePosition[] = []
  function place(id: TreeNodeId | null, depth: number) {
    if (id === null) return
    const node = tree.nodes[id]!
    place(node.left, depth + 1)
    positions.push({ id, x: 65 + positions.length * 108, y: 70 + depth * 140, depth })
    place(node.right, depth + 1)
  }
  place(tree.root, 0)
  const height = positions.length ? Math.max(...positions.map((position) => position.depth)) : -1
  const widths = positions.reduce<Record<number, number>>((levels, position) => {
    levels[position.depth] = (levels[position.depth] ?? 0) + 1
    return levels
  }, {})
  return { positions, width: Math.max(320, positions.length * 108 + 22), height: Math.max(200, height * 140 + 170),
    treeHeight: height, maxWidth: Math.max(0, ...Object.values(widths)) }
}
