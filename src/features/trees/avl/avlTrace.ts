import type { BSTOperation } from '../bst/bstContext'
import { createTreeTrace, type TreeStep } from '../treeTrace'
import type { TraversalKind } from '../treeTraversals'
import { AVLContext, type AVLEvent } from './avlContext'
import { assertAVL, avlMetrics, freezeAVL, type AVLTree } from './avlModel'
import { runAVLOperation } from './avlOperations'

export interface AVLStep extends AVLEvent {
  readonly tree: AVLTree
  readonly lineId: AVLEvent['kind']
  readonly metrics: ReturnType<typeof avlMetrics>
}
function record(event: AVLEvent, tree: AVLTree): AVLStep {
  return Object.freeze({ ...event, tree: freezeAVL(tree), lineId: event.kind, metrics: avlMetrics(tree),
    path: Object.freeze([...event.path]), examined: Object.freeze([...event.examined]), ancestors: Object.freeze([...event.ancestors]),
    locals: Object.freeze({ ...event.locals }), pointer: event.pointer ? Object.freeze({ ...event.pointer }) : null,
    transition: event.transition ? Object.freeze({ ...event.transition }) : null,
    rotation: event.rotation ? Object.freeze({ ...event.rotation }) : null, imbalance: event.imbalance ? Object.freeze({ ...event.imbalance }) : null,
    heightUpdate: event.heightUpdate ? Object.freeze({ ...event.heightUpdate }) : null })
}
export function createAVLTrace(tree: AVLTree, operation: BSTOperation): readonly AVLStep[] {
  const steps: AVLStep[] = []
  runAVLOperation(tree, operation, (event, snapshot) => steps.push(record(event, snapshot)))
  return Object.freeze(steps)
}
export function readyAVLTrace(tree: AVLTree): readonly AVLStep[] {
  assertAVL(tree)
  const steps: AVLStep[] = []
  const ctx = new AVLContext(tree, (event, snapshot) => steps.push(record(event, snapshot)))
  ctx.outcome = 'ready'
  ctx.emit('ready', 'Choose an operation or a rotation example. NULL has height 0, a leaf has height 1, and BF = h(left) − h(right).')
  return Object.freeze(steps)
}
export interface AVLTraversalStep extends Omit<TreeStep, 'tree'> { readonly tree: AVLTree }
export function createAVLTraversal(tree: AVLTree, kind: TraversalKind): readonly AVLTraversalStep[] {
  assertAVL(tree)
  const frozen = freezeAVL(tree)
  return Object.freeze(createTreeTrace(frozen, kind).map((step) => Object.freeze({ ...step, tree: frozen })))
}
