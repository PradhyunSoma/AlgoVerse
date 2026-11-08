import ComplexityPanel from '../../components/ComplexityPanel'
import { graphComplexity } from './complexity'

export default function GraphInfo() {
  return <section className="bubble-info lesson-panel graph-info" aria-labelledby="graph-info-title"><div><p className="eyebrow">UNDERSTAND THE ALGORITHM</p><h2 id="graph-info-title">Explore one level at a time</h2>
    <p>A graph is a collection of <strong>vertices</strong> (places or objects) connected by <strong>edges</strong> (relationships). Directed edges go one way; undirected edges go both ways. An isolated vertex has no connections. Disconnected components have no connecting path; in directed graphs, reachability also depends on arrow direction.</p>
    <p>An <strong>adjacency list</strong> stores each vertex’s outgoing neighbors. Here, uppercase labels are processed alphabetically (digits before letters within a label), regardless of input order. A cycle leads back to a previously reached vertex. We reject self-loops and duplicate edges to keep this first editor simple.</p>
    <p><strong>Breadth-first search</strong> uses a FIFO queue: first in, first out. Dequeue the front, visit it, and add undiscovered neighbors at the rear. Marking a vertex discovered before enqueueing prevents cycles from adding it repeatedly. Visiting adds it to the output; fully processed means all its neighbors have been inspected.</p>
    <p>The queue handles distance 0, then distance 1, then distance 2, and so on. A newly discovered neighbor gets its parent’s distance + 1. Its first discovery therefore gives a <strong>shortest distance by number of edges</strong> in an unweighted graph. Parent edges form a traversal tree. BFS stops when the queue is empty and never silently restarts in another component.</p>
    <p>DFS, available in the algorithm selector, follows one branch deeply before backtracking. BFS instead explores the current distance level before the next. Neither method automatically visits components unreachable from the selected start.</p></div>
    <ComplexityPanel profile={graphComplexity.bfs} />
    </section>
}
