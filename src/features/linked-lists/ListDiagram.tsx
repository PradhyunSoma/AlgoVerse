import { useId } from 'react'
import { listNodes, type ListNode, type NodeId } from './listModel'
import type { ListStep } from './listTrace'

const START_X = 90
const SPACING = 176
const NODE_WIDTH = 136
const NODE_Y = 106
const POINTER_Y = NODE_Y + 38

export function NodeCard({ node, x, labels, unassigned, removed, position }: {
  node: ListNode; x: number; labels: string[]; unassigned: boolean; removed: boolean; position: number
}) {
  return <g transform={`translate(${x}, ${NODE_Y})`} className={`list-node${removed ? ' list-node-removed' : ''}`}
    data-node-id={node.id} data-value={unassigned ? 'unassigned' : node.value} data-next={node.next ?? 'NULL'}
    data-state={labels.join(', ')} aria-label={`${node.id}: data ${unassigned ? 'not assigned' : node.value}, next ${node.next ?? 'NULL'}. ${labels.join(', ')}`}>
    <rect width={NODE_WIDTH} height={76} rx={9} />
    <path d="M 70 0 V 76" className="list-node-divider" />
    <text x={35} y={22} className="list-field-label">DATA</text>
    <text x={35} y={53} className="list-node-value">{unassigned ? '—' : node.value}</text>
    <text x={103} y={22} className="list-field-label">NEXT</text>
    <text x={103} y={50} className="list-node-reference">{removed ? 'released' : node.next ?? 'NULL'}</text>
    <text x={68} y={-13} className="list-node-id">{node.id}{position >= 0 ? ` · position ${position}` : ''}</text>
    {labels.map((label, index) => <text key={label} x={68} y={99 + index * 16} className="list-node-status">{label}</text>)}
  </g>
}

function Pointer({ source, target, fromX, toX, changed, followed, marker }: {
  source: 'HEAD' | NodeId; target: NodeId | null; fromX: number; toX: number;
  changed: boolean; followed: boolean; marker: string
}) {
  const adjacent = toX - fromX < 85
  const d = adjacent ? `M ${fromX} ${POINTER_Y} H ${toX - 7}`
    : `M ${fromX} ${POINTER_Y} C ${fromX + 30} 28, ${toX - 35} 28, ${toX - 7} ${POINTER_Y}`
  return <g className={`list-pointer${changed ? ' is-changed' : ''}${followed ? ' is-followed' : ''}`}
    data-source={source} data-target={target ?? 'NULL'} aria-label={`${source === 'HEAD' ? source : `${source}.next`} points to ${target ?? 'NULL'}${changed ? ', pointer changed' : followed ? ', following pointer' : ''}`}>
    <path d={d} markerEnd={`url(#${marker})`} />
    {changed && <text x={(fromX + toX) / 2} y={adjacent ? POINTER_Y - 12 : 48}>changed</text>}
  </g>
}

export default function ListDiagram({ step }: { step: ListStep }) {
  const marker = useId().replace(/:/g, '')
  const title = useId()
  const description = useId()
  const orderedIds = listNodes(step.state).map((node) => node.id)
  const reachable = new Set(orderedIds)
  const nullX = START_X + step.layout.length * SPACING
  const xFor = (id: NodeId | null) => id === null ? nullX : START_X + step.layout.indexOf(id) * SPACING
  const nodes = step.layout.map((id) => step.state.nodes[id] ?? step.removed!).filter(Boolean)
  return <figure className="list-figure">
    <div className="list-scroll" role="region" aria-label="Linked list diagram, scroll to inspect nodes" tabIndex={0}>
      <svg width={nullX + 88} height={290} role="img" aria-labelledby={title} aria-describedby={description}>
        <title id={title}>Linked list pointer snapshot. HEAD points to {step.state.head ?? 'NULL'}.</title>
        <desc id={description}>{nodes.map((node) => `${node.id}: data ${node.id === step.newId && !step.dataAssigned ? 'not assigned' : node.value}, next ${node.next ?? 'NULL'}${node.id === step.current ? ', current node' : ''}${node.id === step.held ? ', held locally' : ''}${node.id === step.removed?.id ? ', removed: no longer allocated' : !reachable.has(node.id) ? ', detached from HEAD' : ''}.`).join(' ')}</desc>
        <defs><marker id={marker} viewBox="0 0 10 10" refX={8} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
        </marker></defs>
        <text x={30} y={POINTER_Y - 16} className="list-head">HEAD</text>
        <Pointer source="HEAD" target={step.state.head} fromX={38} toX={xFor(step.state.head)}
          changed={step.pointer?.source === 'HEAD'} followed={step.followed === 'HEAD'} marker={marker} />
        {nodes.filter((node) => node.id !== step.removed?.id).map((node) =>
          <Pointer key={`${node.id}-next`} source={node.id} target={node.next} fromX={xFor(node.id) + NODE_WIDTH}
            toX={xFor(node.next)} changed={step.pointer?.source === node.id} followed={step.followed === node.id} marker={marker} />)}
        {nodes.map((node) => {
          const labels = [node.id === step.newId ? 'New node' : null, node.id === step.current ? 'Current' : null,
            node.id === step.previous ? 'Previous' : null, node.id === step.held ? (step.newId ? 'Held: newNode' : 'Held: target') : null,
            node.id === step.removed?.id ? 'Removed' : !reachable.has(node.id) ? 'Detached' : null].filter((label): label is string => label !== null)
          return <NodeCard key={node.id} node={node} x={xFor(node.id)} labels={labels}
            position={orderedIds.indexOf(node.id)}
            unassigned={node.id === step.newId && !step.dataAssigned} removed={node.id === step.removed?.id} />
        })}
        <text x={nullX + 25} y={POINTER_Y + 5} className="list-null">NULL</text>
      </svg>
    </div>
    <figcaption>Arrows follow actual references. Node IDs stay the same even when positions change. Scroll horizontally to inspect longer lists.</figcaption>
    {step.pointer && <p className="list-pointer-update" aria-label="Pointer update">
      <code>{step.pointer.source}{step.pointer.source === 'HEAD' ? '' : '.next'}</code>: {step.pointer.from ?? 'NULL'} → {step.pointer.to ?? 'NULL'}
      <span> Updated reference</span>
    </p>}
  </figure>
}
