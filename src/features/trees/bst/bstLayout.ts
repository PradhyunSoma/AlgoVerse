import { layoutTree } from '../treeLayout'
import type { BinaryTree, TreeNodeId } from '../treeModel'

/** Lay out actual forest components while a mutation holds detached subtrees locally. */
export function layoutBSTSnapshot(tree: BinaryTree) {
  const ids = Object.keys(tree.nodes) as TreeNodeId[]
  const incoming = new Map<TreeNodeId, number>()
  for (const node of Object.values(tree.nodes)) for (const child of [node!.left, node!.right]) {
    if (child === null) continue
    if (!tree.nodes[child]) throw new Error('Dangling child reference in BST snapshot.')
    incoming.set(child, (incoming.get(child) ?? 0) + 1)
    if (incoming.get(child)! > 1) throw new Error('Multiple parents in BST snapshot.')
  }
  const roots = ids.filter((id) => !incoming.has(id))
  if (tree.root !== null && !roots.includes(tree.root)) throw new Error('ROOT is missing or has a parent.')
  roots.sort((a, b) => a === tree.root ? -1 : b === tree.root ? 1 : Number(a.slice(1)) - Number(b.slice(1)))
  const positions: ReturnType<typeof layoutTree>['positions'] = []
  const seen = new Set<TreeNodeId>()
  const detached: TreeNodeId[] = []
  let width = 0
  let height = 200
  let mainHeight = -1
  let mainWidth = 0
  for (const root of roots) {
    const component: TreeNodeId[] = []
    function gather(id: TreeNodeId | null) {
      if (id === null) return
      if (seen.has(id)) throw new Error('Cycle in BST snapshot.')
      seen.add(id); component.push(id)
      gather(tree.nodes[id]!.left); gather(tree.nodes[id]!.right)
    }
    gather(root)
    const subtree = { ...tree, root, nodes: Object.fromEntries(component.map((id) => [id, tree.nodes[id]!])) }
    const layout = layoutTree(subtree)
    positions.push(...layout.positions.map((position) => ({ ...position, x: position.x + width })))
    width += layout.width + 40
    height = Math.max(height, layout.height)
    if (root !== tree.root) detached.push(...component)
    else { mainHeight = layout.treeHeight; mainWidth = layout.maxWidth }
  }
  if (seen.size !== ids.length) throw new Error('Cycle or unreachable component in BST snapshot.')
  return { layout: { positions, width: Math.max(320, width - 40), height, treeHeight: mainHeight, maxWidth: mainWidth }, detached, roots: roots.filter((root) => root !== tree.root) }
}
