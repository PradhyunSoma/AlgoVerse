import { useId } from 'react'
import { NodeCard } from './ListDiagram'
import { circularWalk } from './circularListModel'
import type { CircularStep } from './circularListTrace'
import type { NodeId } from './listModel'

const START = 90
const GAP = 176
const WIDTH = 136
const Y = 144

export default function CircularDiagram({ step }: { step: CircularStep }) {
  const marker = useId().replace(/:/g, '')
  const title = useId()
  const description = useId()
  const ordered = circularWalk(step.state).nodes.map((node) => node.id)
  const nullX = START + step.layout.length * GAP
  const xFor = (id: NodeId | null) => id === null ? nullX : START + step.layout.indexOf(id) * GAP
  const nodes = step.layout.map((id) => step.state.nodes[id] ?? step.removed!).filter(Boolean)
  const returnEdges = nodes.filter((node) => node.id !== step.removed?.id && node.next !== null && xFor(node.next) < xFor(node.id) + WIDTH)
  const height = 390 + Math.max(0, returnEdges.length - 1) * 36
  const changed = (source: string) => step.pointer?.source === source
  const classes = (source: string) => `list-pointer${changed(source) ? ' is-changed' : ''}${step.followed === source ? ' is-followed' : ''}`
  return <figure className="list-figure">
    <div className="list-scroll" role="region" aria-label="Circular linked list diagram, scroll to inspect nodes" tabIndex={0}>
      <svg width={nullX + 88} height={height} role="img" aria-labelledby={title} aria-describedby={description}>
        <title id={title}>Circular list pointer snapshot. HEAD: {step.state.head ?? 'NULL'}, TAIL: {step.state.tail ?? 'NULL'}.</title>
        <desc id={description}>{nodes.map((node) => `${node.id}: data ${node.id === step.newId && !step.dataAssigned ? 'not assigned' : node.value}, next ${node.next ?? 'NULL'}${node.id === step.current ? ', current' : ''}${node.id === step.held ? ', held locally' : ''}${node.id === step.removed?.id ? ', removed' : !ordered.includes(node.id) ? ', detached from HEAD' : ''}.`).join(' ')} The lower return lane follows actual backward-pointing next references. It is a self-loop when source and target are the same node.</desc>
        <defs><marker id={marker} viewBox="0 0 10 10" refX={8} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
        </marker></defs>
        {(['HEAD', 'TAIL'] as const).map((endpoint) => {
          const target = endpoint === 'HEAD' ? step.state.head : step.state.tail
          const x = xFor(target) + (endpoint === 'HEAD' ? 30 : 104)
          return <g key={endpoint} className={`${classes(endpoint)} doubly-endpoint`} data-source={endpoint} data-target={target ?? 'NULL'} aria-label={`${endpoint} points to ${target ?? 'NULL'}`}>
            <text x={target === null ? nullX + 25 : x} y={endpoint === 'HEAD' ? 24 : 54}>{endpoint}{changed(endpoint) ? ' · changed' : ''}{target === null ? ' → NULL' : ''}</text>
            {target !== null && <path d={`M ${x} ${endpoint === 'HEAD' ? 32 : 62} V 100`} markerEnd={`url(#${marker})`} />}
          </g>
        })}
        {nodes.filter((node) => node.id !== step.removed?.id).map((node) => {
          const from = xFor(node.id) + WIDTH
          const to = xFor(node.next)
          const loopsBack = node.next !== null && to < from
          const self = node.next === node.id
          const lane = 340 + returnEdges.findIndex((edge) => edge.id === node.id) * 36
          const d = loopsBack
            ? `M ${from} ${Y} H ${from + 16} V ${lane} H ${to - 20} V ${Y} H ${to - 7}`
            : to - from > 85 ? `M ${from} ${Y} C ${from + 30} 30, ${to - 35} 30, ${to - 7} ${Y}`
              : `M ${from} ${Y} H ${to - 7}`
          return <g key={node.id} className={classes(node.id)} data-source={node.id} data-target={node.next ?? 'NULL'}
            data-loop={loopsBack ? self ? 'self' : 'return' : undefined}
            aria-label={`${node.id}.next points to ${node.next ?? 'NULL'}${self ? ', self-loop' : ''}${changed(node.id) ? ', pointer changed' : ''}`}>
            <path d={d} markerEnd={`url(#${marker})`} />
            {loopsBack && <text x={(from + to) / 2} y={lane + 22}>{self ? 'SELF-LOOP' : node.id === step.state.tail && node.next === step.state.head ? 'TAIL.next → HEAD' : `${node.id}.next → ${node.next}`}{changed(node.id) ? ' · changed' : ''}</text>}
            {!loopsBack && changed(node.id) && <text x={(from + to) / 2} y={to - from > 85 ? 51 : Y - 12}>changed</text>}
          </g>
        })}
        {nodes.map((node) => <NodeCard key={node.id} node={node} x={xFor(node.id)} position={ordered.indexOf(node.id)}
          unassigned={node.id === step.newId && !step.dataAssigned} removed={node.id === step.removed?.id}
          labels={[node.id === step.newId ? 'New node' : null, node.id === step.current ? 'Current' : null,
            node.id === step.previous ? 'Previous' : null, node.id === step.held ? (step.newId ? 'Held: newNode' : 'Held: target') : null,
            node.id === step.removed?.id ? 'Removed' : !ordered.includes(node.id) ? 'Detached' : null].filter((label): label is string => label !== null)} />)}
        {(nodes.some((node) => node.next === null && node.id !== step.removed?.id) || step.state.head === null) && <text x={nullX + 25} y={Y + 5} className="list-null">NULL</text>}
      </svg>
    </div>
    <figcaption>Follow next from left to right, then the lower return arrow back to HEAD. A single node loops to itself.
      Each arrow shows its actual reference in this step. Scroll horizontally for longer lists.</figcaption>
    {step.pointer && <p className="list-pointer-update" aria-label="Pointer update"><code>{step.pointer.source}{step.pointer.source === 'HEAD' || step.pointer.source === 'TAIL' ? '' : '.next'}</code>: {step.pointer.from ?? 'NULL'} → {step.pointer.to ?? 'NULL'}<span>Updated reference</span></p>}
  </figure>
}
