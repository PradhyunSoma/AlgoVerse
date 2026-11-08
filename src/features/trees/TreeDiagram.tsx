import { useId, useLayoutEffect, useMemo, useRef } from 'react'
import { layoutTree } from './treeLayout'
import type { TreeStep } from './treeTrace'
import type { BSTStep } from './bst/bstTrace'
import type { layoutBSTSnapshot } from './bst/bstLayout'
import type { TreeNodeId } from './treeModel'

type DiagramStep = Pick<TreeStep, 'tree' | 'current' | 'stack' | 'queue' | 'output' | 'completed' | 'transition'>
type OrderedStep = Pick<BSTStep, 'path' | 'examined' | 'target' | 'successor' | 'newId' | 'pointer'> & { readonly kind: string }
export interface TreeNodeAnnotation { readonly detail: string; readonly description: string; readonly label?: string; readonly emphasized?: boolean; readonly pending?: boolean }

export default function TreeDiagram({ step, breadthFirst, bst, nodeAnnotations, completedLabel = 'Valid BST' }: {
  step: DiagramStep; breadthFirst: boolean; bst?: ReturnType<typeof layoutBSTSnapshot> & { step: OrderedStep }
  nodeAnnotations?: Readonly<Partial<Record<TreeNodeId, TreeNodeAnnotation>>>; completedLabel?: string
}) {
  const title = useId()
  const description = useId()
  const marker = useId().replace(/:/g, '')
  const layout = useMemo(() => bst?.layout ?? layoutTree(step.tree), [step.tree, bst?.layout])
  const positions = useMemo(() => new Map(layout.positions.map((position) => [position.id, position])), [layout])
  const scrollArea = useRef<HTMLDivElement>(null)
  const rootId = step.tree.root
  const rootX = rootId === null ? layout.width / 2 : positions.get(rootId)!.x
  // Keep ROOT visible when opening a tree or resizing; traversal steps never change scroll.
  useLayoutEffect(() => {
    const region = scrollArea.current!
    const centerRoot = () => { region.scrollLeft = Math.max(0, rootX - region.clientWidth / 2) }
    centerRoot()
    region.scrollTop = 0
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(centerRoot)
    observer.observe(region)
    return () => observer.disconnect()
  }, [rootId, rootX])
  const activePath = bst?.step.path ?? step.stack.flatMap((frame) => frame.nodeId === null ? [] : [frame.nodeId])
  return <figure className="tree-figure">
    <div className="tree-legend"><span>{bst ? 'Current / compared node' : 'Current call / node'}</span><span>{bst ? 'Examined = compared along path' : 'Visited = added to output'}</span><span>{bst ? 'Detached components are held locally' : breadthFirst ? 'Processed = children checked' : 'Complete = subtree returned'}</span></div>
    <div ref={scrollArea} className="tree-scroll" role="region" tabIndex={0} aria-label="Binary tree diagram, scroll to explore" aria-describedby="tree-scroll-help">
      <svg width={layout.width} height={layout.height} role="img" aria-labelledby={title} aria-describedby={description}>
        <title id={title}>Binary tree. ROOT points to {step.tree.root ?? 'NULL'}.</title>
        <desc id={description}>{layout.positions.map(({ id, depth }) => {
          const node = step.tree.nodes[id]!
          return `${id}: value ${node.value}, depth ${depth}, left ${node.left ?? 'NULL'}, right ${node.right ?? 'NULL'}. ${nodeAnnotations?.[id]?.description ?? ''} ${bst?.detached.includes(id) ? 'Detached, held locally. ' : ''}${bst?.step.target === id ? 'Deletion target. ' : ''}${bst?.step.successor === id ? 'Successor. ' : ''}${bst?.step.newId === id ? 'New node. ' : ''}${step.current === id ? 'Current. ' : ''}${activePath.includes(id) ? bst ? 'On search path. ' : 'In call stack. ' : ''}${step.queue.includes(id) ? 'Queued. ' : ''}${step.output.includes(id) ? 'Visited. ' : ''}${step.completed.includes(id) ? breadthFirst ? 'Processed. ' : 'Subtree complete. ' : ''}`
        }).join(' ') || 'The tree is empty.'}</desc>
        <defs><marker id={marker} viewBox="0 0 10 10" refX={8} refY={5} markerWidth={6} markerHeight={6} orient="auto"><path d="M0 0 L10 5 L0 10z" fill="context-stroke" /></marker></defs>
        {step.tree.root === null ? <text className="tree-root" x={160} y={bst && layout.positions.length ? 35 : 85}>ROOT → NULL · {bst && layout.positions.length ? 'No connected tree' : 'Empty tree'}</text> : <g className={`tree-root-pointer${bst?.step.pointer?.source === 'ROOT' ? ' is-changed' : ''}`} data-root={step.tree.root}>
          <text className="tree-root" x={positions.get(step.tree.root)!.x} y={14}>ROOT</text>
          <path d={`M ${positions.get(step.tree.root)!.x} 22 V 39`} markerEnd={`url(#${marker})`} />
        </g>}
        {bst?.roots.map((id) => <text key={id} className="tree-held-title" x={positions.get(id)!.x} y={14}>HELD LOCALLY</text>)}
        {layout.positions.flatMap(({ id, x, y }) => (['left', 'right'] as const).map((side) => {
          const targetId = step.tree.nodes[id]![side]
          const target = targetId === null ? null : positions.get(targetId)!
          const sign = side === 'left' ? -1 : 1
          const selected = step.transition?.source === id && step.transition.side === side
          const onPath = targetId !== null && activePath.includes(id) && activePath.includes(targetId)
          const toX = target?.x ?? x + sign * 40
          const toY = target ? target.y - 28 : y + 69
          return <g key={`${id}-${side}`} className={`tree-edge${selected ? ' is-transition' : ''}${onPath ? ' is-path' : ''}`}
            data-source={id} data-side={side} data-target={targetId ?? 'NULL'} data-active={selected}>
            <path d={`M ${x + sign * 20} ${y + 27} L ${toX} ${toY}`} markerEnd={target ? `url(#${marker})` : undefined} />
            <text x={x + sign * (nodeAnnotations ? 56 : 40)} y={y + 40}>{side === 'left' ? 'L' : 'R'}</text>
            {!target && <text x={toX} y={toY + 14}>NULL</text>}
          </g>
        }))}
        {layout.positions.map(({ id, x, y, depth }) => {
          const node = step.tree.nodes[id]!
          const current = step.current === id
          const visited = bst ? bst.step.examined.includes(id) : step.output.includes(id)
          const complete = bst ? bst.step.kind === 'complete' : step.completed.includes(id)
          const path = activePath.includes(id)
          const queued = step.queue.includes(id)
          const primary = bst ? bst.step.target === id ? 'Delete target' : bst.step.successor === id ? 'Successor' : bst.step.newId === id ? 'New node' : current ? bst.step.kind === 'compare' ? 'Compare' : 'Current' : path ? 'Search path' : 'Ready' : current ? 'Current' : path ? 'In call stack' : queued ? 'Queued' : !visited ? 'Unvisited' : ''
          const annotation = nodeAnnotations?.[id]
          const secondary = bst ? bst.detached.includes(id) ? 'Held locally' : complete ? completedLabel : visited ? 'Examined' : '' : complete ? breadthFirst ? 'Processed' : 'Subtree done' : visited ? 'Visited' : ''
          return <g key={id} transform={`translate(${x}, ${y})`} className="tree-node"
            data-node-id={id} data-value={node.value} data-current={current} data-visited={visited} data-completed={complete} data-emphasized={annotation?.emphasized} data-height-pending={annotation?.pending}
            data-detached={bst?.detached.includes(id)} data-target-node={bst?.step.target === id} data-successor={bst?.step.successor === id} data-new={bst?.step.newId === id} data-path={path} data-queued={queued} data-depth={depth} data-x={x} data-y={y}>
            <rect x={annotation ? -46 : -38} y={-27} width={annotation ? 92 : 76} height={54} rx={12} />
            <text className="tree-value" y={annotation ? -7 : 1}>{node.value}</text><text className="tree-id" y={annotation ? 6 : 18}>{id}</text>
            {annotation && <text className="tree-node-metrics" y={21}>{annotation.detail}</text>}
            <text className="tree-node-state" y={44}>{annotation?.label ?? primary}</text><text className="tree-node-state" y={58}>{secondary}</text>
          </g>
        })}
      </svg>
    </div>
    <figcaption id="tree-scroll-help">L and R label left and right child references. {bst ? 'Arrows show the actual snapshot. Detached components remain held locally until connected or released.' : 'Node positions stay fixed during traversal.'}
      Focus this diagram and use arrow keys to scroll larger trees. {!bst && step.tree.root !== null && `Height: ${layout.treeHeight} edge(s). Maximum width: ${layout.maxWidth} node(s).`}</figcaption>
  </figure>
}
