import { compareLabels } from './graphModel'
import { buildAdjacency } from './graphAdjacency'
import { isDFSStep, vertexState, type TraversalStep } from './graphStep'
import { useMemo } from 'react'
export default function GraphResults({ step }: { step: TraversalStep }) {
  const dfs = isDFSStep(step), algorithm = dfs ? 'DFS' : 'BFS'
  const adjacency = useMemo(() => buildAdjacency(step.graph), [step.graph])
  const label = (id: string) => step.graph.vertices.find(v => v.id === id)!.label
  return <section className="graph-results" aria-labelledby="graph-results-title"><h3 id="graph-results-title">Traversal record</h3>
    {dfs && <h4>Discovery order</h4>}
    <p aria-label={dfs ? 'DFS discovery order' : 'BFS visit order'}>{step.order.length ? step.order.map(label).join(' → ') : 'No vertices visited yet'}</p>
    <p>{step.order.length} / {step.graph.vertices.length} vertices visited · {step.processed.length} fully processed · {dfs ? `${step.stack.length} live calls` : `${step.queue.length} queued`}</p>
    {dfs && <><h4>Completion order · calls returned</h4><p aria-label="DFS completion order">{step.processed.length ? step.processed.map(label).join(' → ') : 'No calls finished yet'}</p><p aria-label="DFS tree edges">Tree edges: {step.treeEdges.length ? Object.entries(step.parents).filter(([, parent]) => parent !== null).map(([child, parent]) => `${label(parent!)} → ${label(child)}`).join(', ') : 'none yet'}</p></>}
    <p aria-label="Unreachable vertices">{step.kind === 'complete' ? `Unreachable: ${step.unreachable.length ? step.unreachable.map(label).join(', ') : 'none'}` : `Unreachable vertices are determined when ${algorithm} finishes.`}</p>
    <div className="graph-table-scroll" tabIndex={0} role="region" aria-label="Traversal records, scroll if needed"><table><caption>Alphabetical adjacency lists and {algorithm} discoveries</caption><thead><tr><th scope="col">Vertex</th><th scope="col">Outgoing neighbors</th><th scope="col">Parent</th><th scope="col">{dfs ? 'State' : 'Distance'}</th></tr></thead>
      <tbody>{[...step.graph.vertices].sort(compareLabels).map(v => <tr key={v.id}><th scope="row">{v.label}</th><td>{adjacency.get(v.id)!.map(n => label(n.vertex)).join(', ') || 'none'}</td><td>{step.parents[v.id] === undefined ? '—' : step.parents[v.id] === null ? 'None (start)' : label(step.parents[v.id]!)}</td><td>{dfs ? vertexState(step, v.id) : step.distances[v.id] ?? (step.unreachable.includes(v.id) ? 'Unreachable' : '—')}</td></tr>)}</tbody></table></div>
    <p>{dfs ? 'Parent edges describe the DFS traversal tree, not shortest paths. Completion order records actual returns, not discoveries.' : 'Distance counts edges from the start. “—” means not yet recorded; it does not mean unreachable until traversal finishes.'}</p>
  </section>
}
