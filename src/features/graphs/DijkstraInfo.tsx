import ComplexityPanel from '../../components/ComplexityPanel'
import { graphComplexity } from './complexity'

export default function DijkstraInfo() {
  return <section className="bubble-info lesson-panel graph-info" aria-labelledby="dijkstra-info-title"><div><p className="eyebrow">UNDERSTAND THE ALGORITHM</p><h2 id="dijkstra-info-title">Choose the cheapest frontier</h2>
    <p>In a weighted graph, each edge has a cost. A route’s cost is the sum of its edge weights. BFS finds the fewest edges, and DFS explores deeply; <strong>Dijkstra finds minimum total cost</strong> when all weights are nonnegative.</p>
    <p>Distances begin at ∞ because no route is known yet. The source starts at 0. A <strong>tentative</strong> distance is the cheapest route found so far. Extracting the lowest valid priority lets us finalize that vertex: its distance cannot improve later. This greedy choice is safe because adding nonnegative weights cannot make a route cheaper. Negative weights would invalidate this argument and are rejected.</p>
    <p><strong>Relaxation</strong> tries dist[current] + edge weight. If this is strictly smaller than the neighbor’s distance, update that distance, record the predecessor, and insert a new candidate into the heap. Equal alternatives keep the first predecessor, including zero-cost alternatives. Neighbor order is alphabetical; heap ties use label, stable ID, and insertion order.</p>
    <p>We use a binary min-heap with duplicate entries instead of decrease-key. A better candidate does not remove the old one. Old entries become <strong>stale</strong>; when extracted, they are skipped. The queue panel shows the real heap array, where only the root is necessarily the minimum; siblings are not a globally sorted list.</p>
    <p>Predecessors point back toward the source. Once a destination is finalized, follow its predecessor chain backward and reverse it to reconstruct the shortest route. The route’s summed weight must match its distance. Tentative paths are not presented as final answers. A vertex still at ∞ after completion is unreachable.</p>
    <p>Restore Sample Graph to verify A=0, B=3, C=1, D=4, E=7 and route A → C → B → D → E at cost 7. Switching algorithms preserves your current graph; BFS and DFS ignore weights without deleting them.</p></div>
    <ComplexityPanel profile={graphComplexity.dijkstra} />
    </section>
}
