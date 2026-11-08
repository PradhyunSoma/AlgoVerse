import { useId } from 'react'
import { doublyNodes, type DoublyNode } from './doublyListModel'
import type { DoublyPointer } from './doublyListOperations'
import type { DoublyStep } from './doublyListTrace'
import type { NodeId } from './listModel'

const START = 104
const GAP = 220
const WIDTH = 168
const TOP = 100

function matches(left: DoublyPointer | null, source: DoublyPointer['source'], field: DoublyPointer['field']) {
  return left?.source === source && left.field === field
}

function DoublyCard({ node, x, labels, unassigned, removed, position }: {
  node: DoublyNode; x: number; labels: string[]; unassigned: boolean; removed: boolean; position: number
}) {
  return <g transform={`translate(${x},${TOP})`} className={`list-node${removed ? ' list-node-removed' : ''}`}
    data-node-id={node.id} data-value={unassigned ? 'unassigned' : node.value} data-prev={node.prev ?? 'NULL'}
    data-next={node.next ?? 'NULL'} data-state={labels.join(', ')}
    aria-label={`${node.id}: prev ${node.prev ?? 'NULL'}, data ${unassigned ? 'not assigned' : node.value}, next ${node.next ?? 'NULL'}. ${labels.join(', ')}`}>
    <rect width={WIDTH} height={80} rx={9} />
    <path d="M 50 0 V 80 M 118 0 V 80" className="list-node-divider" />
    <text x={25} y={23} className="list-field-label doubly-prev-text">PREV</text>
    <text x={84} y={23} className="list-field-label">DATA</text>
    <text x={143} y={23} className="list-field-label doubly-next-text">NEXT</text>
    <text x={25} y={54} className="list-node-reference doubly-prev-text">{removed ? '—' : node.prev ?? 'NULL'}</text>
    <text x={84} y={57} className="list-node-value">{unassigned ? '—' : node.value}</text>
    <text x={143} y={54} className="list-node-reference doubly-next-text">{removed ? '—' : node.next ?? 'NULL'}</text>
    <text x={84} y={-12} className="list-node-id">{node.id}{position >= 0 ? ` · position ${position}` : ''}</text>
    {labels.map((label, index) => <text x={84} y={145 + index * 16} key={label} className="list-node-status">{label}</text>)}
  </g>
}

export default function DoublyDiagram({ step }: { step: DoublyStep }) {
  const marker = useId().replace(/:/g, '')
  const title = useId()
  const description = useId()
  const orderedIds = doublyNodes(step.state).map((node) => node.id)
  const forward = new Set(orderedIds)
  const backward = new Set(doublyNodes(step.state, 'prev').map((node) => node.id))
  const nullRight = START + step.layout.length * GAP
  const xFor = (id: NodeId) => START + step.layout.indexOf(id) * GAP
  const nodes = step.layout.map((id) => step.state.nodes[id] ?? step.removed!).filter(Boolean)
  const labelsFor = (node: DoublyNode) => [node.id === step.newId ? 'New node' : null,
    node.id === step.current ? 'Current' : null, node.id === step.held ? (step.newId ? 'Held: newNode' : 'Held: target') : null,
    node.id === step.removed?.id ? 'Removed' : forward.has(node.id) && !backward.has(node.id) ? 'Forward chain only'
      : backward.has(node.id) && !forward.has(node.id) ? 'Backward chain only'
      : !forward.has(node.id) && !backward.has(node.id) ? 'Detached · held locally' : null,
  ].filter((label): label is string => label !== null)
  function endpoint(source: 'HEAD' | 'TAIL', id: NodeId | null) {
    const field = source === 'HEAD' ? 'head' : 'tail'
    const x = id === null ? (source === 'HEAD' ? 40 : nullRight + 35) : xFor(id) + (source === 'HEAD' ? 34 : 134)
    const changed = matches(step.pointer, source, field)
    return <g key={source} className={`doubly-endpoint${changed ? ' is-changed' : ''}${matches(step.followed, source, field) ? ' is-followed' : ''}`}
      data-source={source} data-field={field} data-target={id ?? 'NULL'} aria-label={`${source} points to ${id ?? 'NULL'}${changed ? ', updated' : ''}`}>
      <text x={x} y={30}>{source}</text>
      <path d={`M ${x} 42 V ${id === null ? 62 : TOP - 25}`} markerEnd={`url(#${marker})`} />
      {id === null && <text x={x} y={80}>NULL</text>}
      {changed && <text x={x} y={15} className="doubly-change-label">updated</text>}
    </g>
  }
  return <figure className="list-figure doubly-figure">
    <p className="doubly-legend"><span>next → Forward · upper lane</span><span>← prev Backward · lower lane</span></p>
    <div className="list-scroll" role="region" aria-label="Doubly linked list diagram, scroll to inspect nodes" tabIndex={0}>
      <svg width={Math.max(360, nullRight + 85)} height={325} role="img" aria-labelledby={title} aria-describedby={description}>
        <title id={title}>Doubly linked list. HEAD points to {step.state.head ?? 'NULL'}, TAIL points to {step.state.tail ?? 'NULL'}.</title>
        <desc id={description}>{nodes.map((node) => `${node.id}: prev ${node.prev ?? 'NULL'}, data ${node.id === step.newId && !step.dataAssigned ? 'not assigned' : node.value}, next ${node.next ?? 'NULL'}. ${labelsFor(node).join(', ')}.`).join(' ')}</desc>
        <defs><marker id={marker} viewBox="0 0 10 10" refX={8} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
        </marker></defs>
        {endpoint('HEAD', step.state.head)}{endpoint('TAIL', step.state.tail)}
        {nodes.filter((node) => node.id !== step.removed?.id).flatMap((node) => (['next', 'prev'] as const).map((field) => {
          const target = node[field]
          const isNext = field === 'next'
          const start = xFor(node.id) + (isNext ? WIDTH : 0)
          const end = target === null ? (isNext ? nullRight : 48) : xFor(target) + (isNext ? 0 : WIDTH)
          const y = isNext ? 126 : 156
          const arrowEnd = end + (isNext ? -7 : 7)
          const short = Math.abs(end - start) < 100
          const controlY = isNext ? 35 : 228
          const d = short ? `M ${start} ${y} H ${arrowEnd}` : `M ${start} ${y} C ${start} ${controlY}, ${end} ${controlY}, ${arrowEnd} ${y}`
          const changed = matches(step.pointer, node.id, field)
          const followed = matches(step.followed, node.id, field)
          return <g key={`${node.id}-${field}`} className={`list-pointer doubly-pointer doubly-${field}${changed ? ' is-changed' : ''}${followed ? ' is-followed' : ''}`}
            data-source={node.id} data-field={field} data-target={target ?? 'NULL'} aria-label={`${node.id}.${field} points to ${target ?? 'NULL'}${changed ? ', updated' : followed ? ', following' : ''}`}>
            <path d={d} markerEnd={`url(#${marker})`} />
            {changed && <text x={(start + end) / 2} y={short ? y + (isNext ? -12 : 18) : controlY}>{field} set</text>}
          </g>
        }))}
        {nodes.map((node) => <DoublyCard key={node.id} node={node} x={xFor(node.id)} labels={labelsFor(node)} position={orderedIds.indexOf(node.id)}
          unassigned={node.id === step.newId && !step.dataAssigned} removed={node.id === step.removed?.id} />)}
        <text x={9} y={161} className="list-null">NULL</text>
        <text x={nullRight + 12} y={131} className="list-null">NULL</text>
      </svg>
    </div>
    <figcaption>Each arrow is an actual reference. Updates happen one pointer at a time, so the forward and backward chains can temporarily differ. Detached nodes remain held locally until connected or released.</figcaption>
    {step.pointer && <p className="list-pointer-update" aria-label="Pointer update"><code>{step.pointer.source}{step.pointer.field === 'next' || step.pointer.field === 'prev' ? `.${step.pointer.field}` : ''}</code>: {step.pointer.from ?? 'NULL'} → {step.pointer.to ?? 'NULL'}<span>Updated reference · reciprocal links are checked on completion</span></p>}
  </figure>
}
