import type { DijkstraStep } from './dijkstraTrace'
import { distanceText } from './graphWeights'
export default function RelaxationPanel({step}:{step:DijkstraStep}) {
  const c=step.comparison, label=(id:string)=>step.graph.vertices.find(v=>v.id===id)!.label
  return <section className="relaxation-panel" aria-labelledby="relaxation-title"><h3 id="relaxation-title">Edge relaxation</h3>{c?<>
    <p className="relaxation-equation">dist[{label(c.from)}] + weight({label(c.from)}, {label(c.to)})<br />= {c.base} + {c.weight} = <strong>{c.alternative}</strong></p>
    <p>Before this check: dist[{label(c.to)}] = {distanceText(c.previous)}.</p>
    <p>{step.kind==='calculate'?'Next, compare this alternative with the existing distance.':step.kind==='compare'?`Is ${c.alternative} < ${distanceText(c.previous)}?`:c.alternative<c.previous?`Yes: ${c.alternative} < ${distanceText(c.previous)}. Improve the distance, update the predecessor, then insert a new candidate.`:`No: ${c.alternative} ≥ ${distanceText(c.previous)}. Keep the existing distance and predecessor.`}</p>
  </>:<p>Inspect an edge to calculate an alternative cost. Only a strictly shorter route changes the distance or predecessor.</p>}</section>
}
