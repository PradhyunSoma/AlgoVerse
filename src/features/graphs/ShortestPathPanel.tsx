import type { DijkstraStep } from './dijkstraTrace'
import { compareLabels, type VertexId } from './graphModel'
import type { PathResult } from './shortestPath'
export default function ShortestPathPanel({step,destination,onDestinationChange,path}:{step:DijkstraStep;destination:VertexId|null;onDestinationChange:(id:VertexId)=>void;path:PathResult}) {
  const label=(id:string)=>step.graph.vertices.find(v=>v.id===id)!.label
  return <section className="shortest-path-panel lesson-panel" aria-labelledby="shortest-path-title"><h2 id="shortest-path-title">Shortest path to a destination</h2>
    <div className="algorithm-selector"><label htmlFor="graph-destination">Destination vertex</label><select id="graph-destination" value={destination??''} disabled={!step.graph.vertices.length} onChange={e=>onDestinationChange(e.target.value as VertexId)}>{!step.graph.vertices.length&&<option value="">No vertices</option>}{[...step.graph.vertices].sort(compareLabels).map(v=><option key={v.id} value={v.id}>{v.label}</option>)}</select><p>Changing destination pauses at this step. A route appears only after its distance is finalized.</p></div>
    {path.status==='ready'?<><p className="shortest-path-route" aria-label="Shortest path">{path.vertices.map(label).join(' → ')}</p><p aria-label="Shortest path cost">Total cost: {path.cost} · Finalized shortest path</p><p>Predecessor chain (destination back to source): {[...path.vertices].reverse().map(label).join(' → ')}. {path.vertices.length===1?'Source and destination are the same; no edges are needed.':'Follow predecessors backward, then reverse the chain to display the route.'}</p></>:<p aria-label="Path availability">{path.message}</p>}
  </section>
}
