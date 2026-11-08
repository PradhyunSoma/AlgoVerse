import type { DijkstraStep } from './dijkstraTrace'
export default function PriorityQueue({step}: {step:DijkstraStep}) {
  const label=(id:string)=>step.graph.vertices.find(v=>v.id===id)!.label
  return <section className="graph-queue priority-queue" aria-labelledby="priority-queue-title"><h3 id="priority-queue-title">Priority queue · binary min-heap</h3>
    <p>Actual heap array order, not a sorted list. Index 0 is the next extract-min; every parent has priority ≤ its children. Ties use label, stable ID, then insertion order.</p>
    <ol tabIndex={0} aria-label="Dijkstra priority queue">{step.heap.map((entry,index)=>{
      const stale=step.finalized.includes(entry.vertex)||entry.distance!==step.distances[entry.vertex]
      return <li key={entry.sequence} data-entry-id={entry.sequence} data-stale={stale} data-inserted={entry.sequence===step.inserted?.sequence}><strong>{label(entry.vertex)} · {entry.distance}</strong><span>#{index}{index===0?' · Min':` · Parent #${Math.floor((index-1)/2)}`}</span><span>{stale?'Stale':entry.sequence===step.inserted?.sequence?'New candidate':'Candidate'} · q{entry.sequence}</span></li>
    })}</ol>
    {!step.heap.length&&<p>Priority queue is empty.</p>}
    {step.extracted&&<p aria-label="Extracted candidate">Extracted: {label(step.extracted.vertex)} · priority {step.extracted.distance}{step.kind==='stale'?' · skipped as stale':''}</p>}
    <p>Improvement inserts a new candidate. Old entries remain visible until extracted and skipped. A stale entry cannot finalize a vertex twice.</p>
  </section>
}
