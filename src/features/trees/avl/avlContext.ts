import { BSTContext, type BSTEvent, type BSTEventKind, type BSTPointer } from '../bst/bstContext'
import type { TreeNodeId } from '../treeModel'
import type { TreeTransition } from '../treeTraversals'
import { height, type AVLNode, type AVLTree, type RotationCase } from './avlModel'

export type AVLEventKind = BSTEventKind | 'return-up' | 'height' | 'balance' | 'balanced' | 'case-LL' | 'case-RR' | 'case-LR' | 'case-RL'
  | 'left-rotation' | 'right-rotation' | 'rotation-detach-pivot' | 'rotation-detach-transfer' | 'rotation-transfer'
  | 'rotation-parent' | 'rotation-attach-root' | 'rotation-done'
export interface Rotation {
  readonly direction: 'left' | 'right'
  readonly root: TreeNodeId
  readonly pivot: TreeNodeId
  readonly transfer: TreeNodeId | null
  readonly parent: TreeNodeId | null
  readonly part: string
}
export interface Imbalance {
  readonly node: TreeNodeId; readonly child: TreeNodeId; readonly grandchild: TreeNodeId | null
  readonly balance: number; readonly childBalance: number; readonly case: RotationCase
}
export interface HeightUpdate { readonly id: TreeNodeId; readonly from: number; readonly to: number }
export interface AVLEvent extends Omit<BSTEvent, 'kind'> {
  readonly kind: AVLEventKind
  readonly rotation: Rotation | null
  readonly imbalance: Imbalance | null
  readonly heightUpdate: HeightUpdate | null
  readonly ancestors: readonly TreeNodeId[]
}
export class AVLContext extends BSTContext {
  declare nodes: Partial<Record<TreeNodeId, AVLNode>>
  rotation: Rotation | null = null
  imbalance: Imbalance | null = null
  heightUpdate: HeightUpdate | null = null
  ancestors: TreeNodeId[] = []
  deletionPath: TreeNodeId[] = []
  private readonly listener?: (event: AVLEvent, tree: AVLTree) => void
  constructor(tree: AVLTree, listener?: (event: AVLEvent, tree: AVLTree) => void) {
    super(tree)
    this.listener = listener
  }
  override state(): AVLTree { return { root: this.root, nodes: this.nodes, nextId: this.nextId } }
  override allocate(value: number): TreeNodeId {
    const id = super.allocate(value)
    this.nodes[id] = { ...this.nodes[id]!, height: 1 }
    return id
  }
  override emit(kind: AVLEventKind, explanation: string, transition: TreeTransition | null = null, pointer: BSTPointer | null = null) {
    if (kind === 'target') this.deletionPath = [...this.path]
    this.listener?.({ kind, explanation, current: this.current, path: this.path, examined: this.examined, target: this.target,
      successor: this.successor, newId: this.newId, locals: this.locals, pointer, transition, result: this.result, outcome: this.outcome,
      rotation: this.rotation, imbalance: this.imbalance, heightUpdate: this.heightUpdate, ancestors: this.ancestors }, this.state())
  }
  override write(source: BSTPointer['source'], field: BSTPointer['field'], to: TreeNodeId | null, kind: AVLEventKind, explanation: string) {
    const from = source === 'ROOT' ? this.root : this.nodes[source]![field as 'left' | 'right']
    if (source === 'ROOT') this.root = to
    else this.nodes[source] = { ...this.nodes[source]!, [field]: to }
    this.emit(kind, explanation, source === 'ROOT' ? null : { source, side: field as 'left' | 'right', target: to }, { source, field, from, to })
  }
  updateHeight(id: TreeNodeId) {
    const node = this.nodes[id]!
    const left = height(this.state(), node.left), right = height(this.state(), node.right)
    const to = 1 + Math.max(left, right)
    this.nodes[id] = { ...node, height: to }
    this.current = id
    this.heightUpdate = { id, from: node.height, to }
    this.emit('height', `Update ${this.label(id)}: h = 1 + max(${left}, ${right}) = ${to} (was ${node.height}). Children are updated before their parent.`)
    this.heightUpdate = null
  }
}
