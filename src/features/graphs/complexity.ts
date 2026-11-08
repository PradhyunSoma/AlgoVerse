import type { ComplexityProfile } from '../../components/complexity'

const variables = 'V = number of vertices; E = number of edges. An undirected edge is stored in two neighbor lists, which changes only a constant factor.'
const preprocessing = 'These traversal bounds assume adjacency lists are ready. This implementation validates and builds them in O(V + E), then sorts neighbors alphabetically in up to O(E log V) additional time. It follows only vertices reachable from the source; O(V + E) is a whole-graph upper bound, not an exact visit count.'
const snapshots = 'Adjacency storage uses O(V + E), separate from traversal auxiliary space. Returned output, parents, and distances use O(V). Full trace snapshots copy collections at many events and require additional time and memory. Alphabetical unreachable-result reporting can add O(V log V) work. Neither trace length nor playback speed measures algorithm runtime.'
export const graphComplexity = {
  bfs: {
    name: 'Breadth-First Search', variables,
    rows: [{ label: 'Core traversal time', bound: 'O(V + E)' }, { label: 'Core auxiliary space', bound: 'O(V)' }],
    why: 'Marking vertices discovered when enqueued prevents duplicate enqueues. Each reachable vertex is processed once and each outgoing adjacency entry inspected once. The FIFO queue uses a front cursor, not array shifting.',
    assumptions: [preprocessing, 'The backing queue retains dequeued entries until the run ends, still at most O(V). Discovery, parent, and distance records also use O(V). Edge weights are ignored: BFS finds distances in hops. With an adjacency matrix, scanning all neighbors could instead require O(V²) time.'],
    storage: [snapshots],
  },
  dfs: {
    name: 'Depth-First Search', variables,
    rows: [{ label: 'Core traversal time', bound: 'O(V + E)' }, { label: 'Core auxiliary space', bound: 'O(V)' }, { label: 'Worst recursion depth', bound: 'O(V)' }],
    why: 'Discovery prevents repeated calls through cycles. Each reachable vertex and its outgoing adjacency entries are explored once. A graph shaped like a long path can keep V recursive calls active.',
    assumptions: [preprocessing, 'Recursive DFS marks discovery at call entry. The discovered set, call stack, parent tree, and output use O(V). A star stays shallow, but a long chain reaches the worst recursion depth. Weights are ignored; DFS does not guarantee shortest routes.'],
    storage: [snapshots],
  },
  dijkstra: {
    name: 'Dijkstra', variables,
    rows: [{ label: 'Core time · simple graph', bound: 'O((V + E) log V)' }, { label: 'Distance / predecessor / finalized state', bound: 'O(V)' }, { label: 'Binary heap · lazy duplicates', bound: 'O(E + 1)' }, { label: 'Total core auxiliary space', bound: 'O(V + E)' }],
    why: 'A strict relaxation inserts a candidate into a binary min-heap. At most O(E) improvements plus the source are inserted and extracted. Old candidates stay until extracted and skipped as stale; they can make the queue larger than V.',
    assumptions: ['Weights must be finite nonnegative integers (0–99 here). Parallel edges and self-loops are rejected. Heap ties use label, stable ID, and insertion order; equal-cost alternatives do not update predecessors.', 'This is a binary heap with lazy duplicate entries, not linear minimum selection or a decrease-key heap. Each heap operation costs O(log(E + 1)). Since a simple graph has E ≤ V², the usual bound is O((V + E) log V). Empty and single-vertex cases require constant handling; logarithms may be read as log(max(2, V)).', 'Building/validating adjacency lists takes O(V + E), with up to O(E log V) alphabetical sorting. Graph representation and the heap strategy determine the bound. Only reachable edges are relaxed, but distance initialization covers all vertices.'],
    storage: ['Distance/predecessor/finalized records require O(V); the heap can retain O(E + 1) entries. Graph/adjacency storage is O(V + E). Trace snapshots and the rendered table/heap add storage beyond core Dijkstra.', 'A predecessor chain has at most V vertices, so its route output needs O(V) space. The current UI defensively scans finalized IDs and the edge array at each link: reconstruction can take O(V(V + E)) time. This extra path-display work is separate from the Dijkstra bound; tentative routes are never presented as final.'],
  },
} satisfies Record<string, ComplexityProfile>
