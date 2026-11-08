import { immutableTree, MAX_TREE_NODES, type BinaryTree } from '../treeModel'
import { assertBST, assertBSTValue } from './bstModel'
import { BSTContext, type BSTEvent, type BSTOperation } from './bstContext'
import { insertBST } from './bstInsert'
import { searchBST } from './bstSearch'
import { deleteBST } from './bstDelete'
import { extremeBST } from './bstExtrema'
export interface BSTStep extends BSTEvent { readonly tree: BinaryTree; readonly lineId: BSTEvent['kind'] }
function record(event: BSTEvent, tree: BinaryTree): BSTStep {
  // Intermediate states can be forests. Do not call complete-tree validation here.
  const nodes = Object.freeze(Object.fromEntries(Object.values(tree.nodes).map((node) => [node!.id, Object.freeze({ ...node! })])))
  return Object.freeze({ ...event, tree: Object.freeze({ ...tree, nodes }), lineId: event.kind,
    path: Object.freeze([...event.path]), examined: Object.freeze([...event.examined]), locals: Object.freeze({ ...event.locals }),
    pointer: event.pointer ? Object.freeze({ ...event.pointer }) : null, transition: event.transition ? Object.freeze({ ...event.transition }) : null })
}
export function readyBSTTrace(tree: BinaryTree): readonly BSTStep[] {
  assertBST(tree)
  const steps: BSTStep[] = []
  const ctx = new BSTContext(tree, (event, state) => steps.push(record(event, state)))
  ctx.outcome = 'ready'
  ctx.emit('ready', 'Choose an operation. Duplicate keys are rejected; each completed mutation becomes the next operation’s input.')
  return Object.freeze(steps)
}
export function createBSTTrace(tree: BinaryTree, operation: BSTOperation): readonly BSTStep[] {
  assertBST(tree)
  if ('value' in operation) assertBSTValue(operation.value)
  if (operation.kind === 'insert') {
    if (Object.values(tree.nodes).some((node) => node!.value === operation.value)) throw new RangeError(`${operation.value} already exists. Duplicate insertions are not allowed.`)
    if (Object.keys(tree.nodes).length >= MAX_TREE_NODES) throw new RangeError(`The BST is full. Delete a node first (maximum ${MAX_TREE_NODES}).`)
  }
  const steps: BSTStep[] = []
  const ctx = new BSTContext(tree, (event, state) => steps.push(record(event, state)))
  if (operation.kind === 'insert') insertBST(ctx, operation.value)
  else if (operation.kind === 'search') searchBST(ctx, operation.value)
  else if (operation.kind === 'delete') deleteBST(ctx, operation.value)
  else extremeBST(ctx, operation.kind)
  assertBST(ctx.state())
  const result = ctx.result === null ? '' : ` Result: ${ctx.label(ctx.result)}.`
  ctx.current = ctx.result
  ctx.locals = {}
  ctx.emit('complete', `Operation complete: ${ctx.outcome}.${result} The BST ordering and references are valid.`)
  return Object.freeze(steps)
}
export function bstDiagramStep(step: BSTStep) {
  return { tree: step.tree, current: step.current, transition: step.transition, stack: [], queue: [], output: [], completed: [] }
}
export function finalBST(trace: readonly BSTStep[]) { return immutableTree(trace.at(-1)!.tree) }
