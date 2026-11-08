import { immutableTree, type BinaryTree } from './treeModel'
import { traverseTree, type TreeEvent, type TraversalKind } from './treeTraversals'

export interface TreeStep extends TreeEvent {
  readonly tree: BinaryTree
  readonly lineId: TreeEvent['kind']
}
export function createTreeTrace(input: BinaryTree, traversal: TraversalKind): readonly TreeStep[] {
  const tree = immutableTree(input)
  const steps: TreeStep[] = []
  traverseTree(tree, traversal, (event) => {
    steps.push(Object.freeze({ ...event, tree, lineId: event.kind,
      stack: Object.freeze(event.stack.map((frame) => Object.freeze({ ...frame }))),
      queue: Object.freeze([...event.queue]), output: Object.freeze([...event.output]), completed: Object.freeze([...event.completed]),
      transition: event.transition ? Object.freeze({ ...event.transition }) : null }))
  })
  return Object.freeze(steps)
}
