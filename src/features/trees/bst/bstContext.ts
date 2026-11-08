import type { BinaryTree, TreeNode, TreeNodeId } from '../treeModel'
import type { TreeTransition } from '../treeTraversals'

export const bstOperationLabels = { insert: 'Insert', search: 'Search', delete: 'Delete', minimum: 'Find minimum', maximum: 'Find maximum' } as const
export type BSTOperationKind = keyof typeof bstOperationLabels
export type BSTOperation = { kind: 'insert' | 'search' | 'delete'; value: number } | { kind: 'minimum' | 'maximum' }
export type BSTEventKind = 'ready' | 'start' | 'compare' | 'move-left' | 'move-right' | 'found' | 'missing' | 'empty'
  | 'slot' | 'allocate' | 'connect' | 'target' | 'leaf' | 'one-child' | 'two-children' | 'successor-start'
  | 'successor-check' | 'successor-left' | 'successor-found' | 'detach-child' | 'detach-successor-child' | 'bypass-successor'
  | 'detach-right' | 'detach-left' | 'transplant' | 'attach-left' | 'attach-right' | 'remove' | 'extreme-check' | 'extreme-found' | 'complete'
export interface BSTPointer {
  readonly source: 'ROOT' | TreeNodeId
  readonly field: 'root' | 'left' | 'right'
  readonly from: TreeNodeId | null
  readonly to: TreeNodeId | null
}
export type BSTLocals = Readonly<Partial<Record<'parent' | 'target' | 'successor' | 'successorParent' | 'leftSubtree' | 'rightSubtree' | 'child' | 'newNode', TreeNodeId | null>>>
export interface BSTEvent {
  readonly kind: BSTEventKind
  readonly current: TreeNodeId | null
  readonly path: readonly TreeNodeId[]
  readonly examined: readonly TreeNodeId[]
  readonly target: TreeNodeId | null
  readonly successor: TreeNodeId | null
  readonly newId: TreeNodeId | null
  readonly locals: BSTLocals
  readonly pointer: BSTPointer | null
  readonly transition: TreeTransition | null
  readonly result: TreeNodeId | null
  readonly outcome: 'ready' | 'pending' | 'found' | 'missing' | 'inserted' | 'deleted' | 'empty'
  readonly explanation: string
}
/** Mutable private working copy; only the trace recorder exposes immutable snapshots. */
export class BSTContext {
  nodes: Partial<Record<TreeNodeId, TreeNode>>
  root: TreeNodeId | null
  nextId: number
  current: TreeNodeId | null = null
  path: TreeNodeId[] = []
  examined: TreeNodeId[] = []
  target: TreeNodeId | null = null
  successor: TreeNodeId | null = null
  newId: TreeNodeId | null = null
  locals: Partial<Record<keyof BSTLocals, TreeNodeId | null>> = {}
  result: TreeNodeId | null = null
  outcome: BSTEvent['outcome'] = 'pending'
  private readonly observe?: (event: BSTEvent, tree: BinaryTree) => void
  constructor(tree: BinaryTree, observe?: (event: BSTEvent, tree: BinaryTree) => void) {
    this.observe = observe
    this.root = tree.root
    this.nextId = tree.nextId
    this.nodes = Object.fromEntries(Object.values(tree.nodes).map((node) => [node!.id, { ...node! }]))
  }
  state(): BinaryTree { return { root: this.root, nodes: this.nodes, nextId: this.nextId } }
  allocate(value: number): TreeNodeId {
    const id: TreeNodeId = `t${this.nextId++}`
    this.nodes[id] = { id, value, left: null, right: null }
    return id
  }
  label(id: TreeNodeId | null) { return id === null ? 'NULL' : `${this.nodes[id]!.value} (${id})` }
  emit(kind: BSTEventKind, explanation: string, transition: TreeTransition | null = null, pointer: BSTPointer | null = null) {
    this.observe?.({ kind, explanation, current: this.current, path: this.path, examined: this.examined, target: this.target,
      successor: this.successor, newId: this.newId, locals: this.locals, pointer, transition, result: this.result, outcome: this.outcome }, this.state())
  }
  write(source: 'ROOT' | TreeNodeId, field: BSTPointer['field'], to: TreeNodeId | null, kind: BSTEventKind, explanation: string) {
    const from = source === 'ROOT' ? this.root : this.nodes[source]![field as 'left' | 'right']
    if (source === 'ROOT') this.root = to
    else this.nodes[source] = { ...this.nodes[source]!, [field]: to }
    this.emit(kind, explanation, source === 'ROOT' ? null : { source, side: field as 'left' | 'right', target: to }, { source, field, from, to })
  }
  examine(id: TreeNodeId) {
    this.current = id
    if (!this.path.includes(id)) this.path.push(id)
    if (!this.examined.includes(id)) this.examined.push(id)
  }
}
