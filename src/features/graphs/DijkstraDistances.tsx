import { compareLabels } from './graphModel'
import { distanceText } from './graphWeights'
import type { DijkstraStep } from './dijkstraTrace'
export default function DijkstraDistances({step}:{step:DijkstraStep}) {
  const label=(id:string)=>step.graph.vertices.find(v=>v.id===id)!.label
  return <section className="graph-results" aria-labelledby="distance-table-title"><h3 id="distance-table-title">Shortest-known distances</h3>
    <p>{step.finalized.length} / {step.graph.vertices.length} vertices finalized. Tentative values can still improve.</p>
    <p aria-label="Finalization order">Finalized: {step.finalized.length?step.finalized.map(label).join(' → '):'none yet'}</p>
    <div className="graph-table-scroll" tabIndex={0} role="region" aria-label="Dijkstra distance records"><table><caption>Distances and predecessors at this exact step</caption><thead><tr><th scope="col">Vertex</th><th scope="col">Distance</th><th scope="col">Predecessor</th><th scope="col">Status</th></tr></thead><tbody>
      {[...step.graph.vertices].sort(compareLabels).map(v=><tr key={v.id} data-distance-id={v.id} data-affected={step.neighbor===v.id} data-active={step.active===v.id}><th scope="row">{v.label}{step.active===v.id?' · current':''}</th><td>{distanceText(step.distances[v.id]!)}</td><td>{step.kind==='relax'&&step.neighbor===v.id?'Update pending':step.parents[v.id]?label(step.parents[v.id]!):'—'}</td><td>{step.finalized.includes(v.id)?'Finalized':Number.isFinite(step.distances[v.id])?'Tentative':step.kind==='complete'?'Unreachable':'Unvisited'}</td></tr>)}
    </tbody></table></div><p>∞ means no known route. It means unreachable only when the run finishes. Finalized distances are guaranteed shortest; tentative predecessor edges may change.</p>
  </section>
}
