import type { BinaryTree, TreeNode, TreeNodeId } from '../treeModel'
import { assertBST } from '../bst/bstModel'

export interface AVLNode extends TreeNode { readonly height: number }
export interface AVLTree extends BinaryTree { readonly nodes: Readonly<Partial<Record<TreeNodeId, AVLNode>>> }
export const AVL_SAMPLE = [40, 20, 60, 10, 30, 50, 70] as const
export const rotationPresets = { LL: [30, 20, 10], RR: [10, 20, 30], LR: [30, 10, 20], RL: [10, 30, 20] } as const
export type RotationCase = keyof typeof rotationPresets

export function height(tree: AVLTree, id: TreeNodeId | null): number { return id === null ? 0 : tree.nodes[id]!.height }
export function balanceFactor(tree: AVLTree, id: TreeNodeId): number {
  const node = tree.nodes[id]!
  return height(tree, node.left) - height(tree, node.right)
}
export function assertAVL(tree: AVLTree) {
  assertBST(tree)
  function visit(id: TreeNodeId | null): number {
    if (id === null) return 0
    const node = tree.nodes[id]!
    const left = visit(node.left), right = visit(node.right)
    if (node.height !== 1 + Math.max(left, right)) throw new Error(`Incorrect stored height at ${id}.`)
    if (Math.abs(left - right) > 1) throw new Error(`AVL balance invariant violated at ${id}.`)
    return node.height
  }
  visit(tree.root)
}
/** Also used for intermediate forests: validation belongs at operation boundaries. */
export function freezeAVL(tree: AVLTree): AVLTree {
  return Object.freeze({ ...tree, nodes: Object.freeze(Object.fromEntries(Object.values(tree.nodes).map((node) => [node!.id, Object.freeze({ ...node! })]))) })
}
export function emptyAVL(nextId = 1): AVLTree { return freezeAVL({ root: null, nodes: {}, nextId }) }
export interface AVLMetric { readonly height: number; readonly actualHeight: number; readonly balance: number; readonly pending: boolean }
/** Presentation only: derive actual structural heights, even while cached heights await repair. */
export function avlMetrics(tree: AVLTree): Readonly<Partial<Record<TreeNodeId, AVLMetric>>> {
  const metrics: Partial<Record<TreeNodeId, AVLMetric>> = {}
  const visiting = new Set<TreeNodeId>()
  function inspect(id: TreeNodeId | null): number {
    if (id === null) return 0
    if (metrics[id]) return metrics[id]!.actualHeight
    if (visiting.has(id)) throw new Error('Cycle in AVL snapshot.')
    visiting.add(id)
    const node = tree.nodes[id]!
    const left = inspect(node.left), right = inspect(node.right)
    const actualHeight = 1 + Math.max(left, right)
    metrics[id] = Object.freeze({ height: node.height, actualHeight, balance: left - right, pending: node.height !== actualHeight })
    visiting.delete(id)
    return actualHeight
  }
  for (const id of Object.keys(tree.nodes) as TreeNodeId[]) inspect(id)
  return Object.freeze(metrics)
}
