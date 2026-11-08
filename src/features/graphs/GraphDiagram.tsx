import { weightLabels } from './weightLabels'
import { distanceText } from './graphWeights'
import type { PathResult } from './shortestPath'
import { useId, useMemo } from 'react'
import { isDijkstraStep, isDFSStep, vertexState, type GraphStep } from './graphStep'
import { edgePath, layoutGraph } from './graphLayout'
export default function GraphDiagram({ step, path }: { step: GraphStep; path?: PathResult }) {
  const dfs = isDFSStep(step), weighted = isDijkstraStep(step), algorithm = weighted ? 'Dijkstra' : dfs ? 'DFS' : 'BFS'
  const returning = dfs ? step.returned : null
  const markerId = useId(), titleId = useId(), descriptionId = useId()
  const positions = useMemo(() => layoutGraph(step.graph), [step.graph])
  const weights = useMemo(() => weighted ? weightLabels(step.graph, positions) : null, [weighted,step.graph,positions])
  const routeEdges = path?.status === 'ready' ? path.edges : []
  const routeVertices = path?.status === 'ready' ? path.vertices : []
  const label = (id: string) => step.graph.vertices.find(v => v.id === id)!.label
  return <figure className="graph-figure">
    {weighted ? <div className="graph-legend dijkstra-legend" aria-label="Graph legend"><span>○ Unvisited</span><span>◇ Tentative</span><span>◎ Current</span><span>✓ Finalized</span><span>┄ Inspect</span><span>↘ Relaxed</span><span>━ Selected shortest path</span></div> : <div className="graph-legend" data-algorithm={algorithm} aria-label="Graph legend"><span>○ {dfs ? 'Undiscovered' : 'Unvisited'}</span><span>◇ Discovered</span><span>{dfs ? '▱ On stack' : '▱ Queued'}</span><span>◎ Active</span><span>✓ Processed</span><span>━ {algorithm} tree</span><span>┄ Inspected edge</span>{dfs && <span>↩ Return to caller</span>}</div>}
    <div className="graph-scroll" tabIndex={0} role="region" aria-label="Graph diagram, scroll with arrow keys">
      <svg width="640" height={step.graph.vertices.length > 6 ? 620 : 550} viewBox={`0 0 640 ${step.graph.vertices.length > 6 ? 620 : 550}`} role="img" aria-labelledby={`${titleId} ${descriptionId}`}>
        <title id={titleId}>{weighted ? 'Dijkstra shortest-path graph' : dfs ? 'Depth-first search graph' : 'Breadth-first search graph'}</title><desc id={descriptionId}>{step.graph.directed ? 'Directed edges have arrowheads.' : 'Undirected edges work in both directions.'} Start: {step.start ? label(step.start) : 'none'}. Node labels show their current state. {step.explanation}</desc>
        <defs><marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" /></marker></defs>
        {step.graph.edges.map(edge => <g key={edge.id} data-edge-id={edge.id} data-inspected={edge.id === step.inspectedEdge} data-tree={step.treeEdges.includes(edge.id)} data-tentative={weighted && Object.entries(step.predecessorEdges).some(([vertex,id])=>id===edge.id&&!step.finalized.some(v=>v===vertex))} data-relaxed={weighted && ['relax','predecessor','enqueue'].includes(step.kind) && step.inspectedEdge===edge.id} data-shortest-path={routeEdges.includes(edge.id)} data-backtracking={returning?.edge === edge.id} data-path={dfs && step.stack.some(frame => frame.via === edge.id)} className="graph-edge">
          <title>{label(edge.source)} {step.graph.directed ? '→' : '↔'} {label(edge.destination)} · {edge.id}{weighted ? ` · weight ${edge.weight}` : ''}{step.treeEdges.includes(edge.id) ? ` · ${algorithm} tree edge` : ''}{edge.id === step.inspectedEdge ? ' · inspecting' : ''}{returning?.edge === edge.id ? ` · control returned from ${label(returning.vertex)} to ${label(returning.caller!)}, not a reverse edge traversal` : ''}</title>
          <path d={edgePath(positions.get(edge.source)!, positions.get(edge.destination)!, step.graph.directed && step.graph.edges.some(other => other.source === edge.destination && other.destination === edge.source))} markerEnd={step.graph.directed ? `url(#${markerId})` : undefined} />
        </g>)}
        {weights && step.graph.edges.map(edge=>{
          const {point,anchor}=weights.get(edge.id)!
          return <g className="graph-weight" key={edge.id} data-weight-edge={edge.id}><title>{label(edge.source)} {step.graph.directed?'→':'↔'} {label(edge.destination)} · weight {edge.weight}</title><line x1={anchor.x} y1={anchor.y} x2={point.x} y2={point.y} /><rect x={point.x-17} y={point.y-11} width="34" height="22" rx="5" /><text x={point.x} y={point.y+4}>{edge.weight}</text></g>
        })}
        {step.graph.vertices.map(vertex => {
          const p = positions.get(vertex.id)!
          const state = vertexState(step, vertex.id)
          return <g key={vertex.id} className="graph-node" data-vertex-id={vertex.id} data-state={state} data-current={weighted && step.active===vertex.id} data-shortest-path={routeVertices.includes(vertex.id)} data-exited={returning?.vertex === vertex.id} transform={`translate(${p.x} ${p.y})`}>
            <title>{vertex.label} · {vertex.id} · {state}{!dfs && ` · distance ${weighted ? distanceText(step.distances[vertex.id]!) : step.distances[vertex.id] ?? 'unknown'}`} {vertex.id === step.start ? ' · Start' : ''}</title>
            <circle r="31" /><text className="graph-label" y="6">{vertex.label}</text>
            <text className="graph-node-status" y="48">{returning?.vertex === vertex.id ? '↩ Exited · ' : state === 'Processed' ? '✓ ' : ''}{state}</text>
            <text className="graph-node-meta" y="-43">{vertex.id === step.start ? 'START · ' : ''}{dfs ? step.stack.some(frame => frame.vertex === vertex.id) ? `Call depth: ${step.stack.findIndex(frame => frame.vertex === vertex.id) + 1}` : '' : step.distances[vertex.id] === undefined ? 'd: —' : `d: ${weighted ? distanceText(step.distances[vertex.id]!) : step.distances[vertex.id]}`}</text>
          </g>
        })}
        {!step.graph.vertices.length && <text className="graph-empty" x="320" y="260">Empty graph · Add vertices to begin</text>}
      </svg>
    </div>
    <figcaption>{weighted && <>Weights appear on opaque plaques with leaders where needed. Violet predecessor edges can be tentative (dashed); cyan edges are the selected finalized shortest path. Green nodes are finalized. </>}Positions stay fixed throughout playback. {weighted ? 'Violet edges show current predecessors' : <>Solid violet edges form the {algorithm} tree</>}; the dashed amber edge is being inspected. {step.graph.directed ? 'Follow arrowheads. Opposite directed edges use separate curved lanes.' : 'Connections can be followed in either direction.'} {dfs && 'Cyan highlights show control returning to a caller, not a reverse graph edge. '}Scroll or focus this canvas and use arrow keys on a smaller screen.</figcaption>
  </figure>
}
