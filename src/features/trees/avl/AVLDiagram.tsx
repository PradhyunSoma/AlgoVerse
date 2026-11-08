import { useMemo } from 'react'
import TreeDiagram, { type TreeNodeAnnotation } from '../TreeDiagram'
import { layoutBSTSnapshot } from '../bst/bstLayout'
import type { TreeNodeId } from '../treeModel'
import { avlMetrics } from './avlModel'
import type { AVLStep, AVLTraversalStep } from './avlTrace'

export default function AVLDiagram({ step, breadthFirst }: { step: AVLStep | AVLTraversalStep; breadthFirst: boolean }) {
  const operation = 'outcome' in step ? step : null
  const metrics = useMemo(() => operation?.metrics ?? avlMetrics(step.tree), [operation, step.tree])
  const forest = useMemo(() => operation ? layoutBSTSnapshot(step.tree) : null, [operation, step.tree])
  const annotations: Partial<Record<TreeNodeId, TreeNodeAnnotation>> = {}
  for (const id of Object.keys(step.tree.nodes) as TreeNodeId[]) {
    const metric = metrics[id]!
    const rotation = operation?.rotation, imbalance = operation?.imbalance
    const label = rotation?.pivot === id ? 'Pivot ↑' : rotation?.root === id ? 'Rotating root' : rotation?.transfer === id ? 'Moved subtree'
      : imbalance?.node === id ? Math.abs(metric.balance) > 1 ? 'Unbalanced' : 'Repair node'
        : imbalance?.child === id ? 'Rotation child' : imbalance?.grandchild === id ? 'Grandchild' : undefined
    annotations[id] = { detail: `h:${metric.height}${metric.pending ? '*' : ''} BF:${metric.balance > 0 ? '+' : ''}${metric.balance}`,
      description: `Stored height ${metric.height}, actual height ${metric.actualHeight}, balance factor ${metric.balance}.${metric.pending ? ' Height update pending.' : ''} ${label ?? ''}`,
      label, emphasized: Math.abs(metric.balance) > 1, pending: metric.pending }
  }
  return <><TreeDiagram step={operation ? { tree: step.tree, current: step.current, transition: step.transition, stack: [], queue: [], output: [], completed: [] } : step as AVLTraversalStep}
    breadthFirst={breadthFirst} bst={operation && forest ? { ...forest, step: operation } : undefined} nodeAnnotations={annotations} completedLabel="Valid AVL" />
    <p className="bst-snapshot-note">h = stored height (NULL 0, leaf 1). BF = actual h(left) − h(right) using current links.
      An asterisk (*) means the stored height awaits recalculation. Intermediate mutations can be unbalanced or have locally held subtrees.</p>
    {Object.entries(metrics).some(([, metric]) => metric!.pending) && <p className="bst-snapshot-note" aria-label="Pending height updates">
      Pending heights: {Object.entries(metrics).filter(([, metric]) => metric!.pending).map(([id, metric]) => `${id}: stored ${metric!.height}, actual ${metric!.actualHeight}`).join(' · ')}.
    </p>}
  </>
}
