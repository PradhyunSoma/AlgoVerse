import { buildAdjacency } from './graphAdjacency'
import { compareLabels, type EdgeId, type Graph, type VertexId } from './graphModel'
import { distanceText } from './graphWeights'
import { MinHeap } from './minHeap'

export interface QueueEntry { readonly vertex: VertexId; readonly distance: number; readonly sequence: number }
export interface Relaxation { readonly from: VertexId; readonly to: VertexId; readonly weight: number; readonly base: number; readonly alternative: number; readonly previous: number }
export type DijkstraKind = 'initialize' | 'source' | 'queue-init' | 'enqueue-start' | 'loop' | 'extract' | 'stale-check' | 'stale' | 'finalize' | 'inspect' | 'calculate' | 'compare' | 'relax' | 'predecessor' | 'enqueue' | 'skip' | 'complete'
export interface DijkstraEvent {
  readonly kind: DijkstraKind
  readonly explanation: string
  readonly start: VertexId | null
  readonly active: VertexId | null
  readonly neighbor: VertexId | null
  readonly inspectedEdge: EdgeId | null
  readonly distances: Readonly<Partial<Record<VertexId, number>>>
  readonly parents: Readonly<Partial<Record<VertexId, VertexId | null>>>
  readonly predecessorEdges: Readonly<Partial<Record<VertexId, EdgeId>>>
  readonly finalized: readonly VertexId[]
  readonly heap: readonly QueueEntry[]
  readonly extracted: QueueEntry | null
  readonly inserted: QueueEntry | null
  readonly comparison: Relaxation | null
  readonly treeEdges: readonly EdgeId[]
  readonly unreachable: readonly VertexId[]
}
/** Lazy duplicate entries avoid decrease-key; strict improvement preserves the first equal-cost predecessor. */
export function dijkstra(graph: Graph, start: VertexId | null, observe?: (event: DijkstraEvent) => void) {
  const adjacency = buildAdjacency(graph) // Also validates every weight before any event is emitted.
  if (graph.vertices.length ? start === null || !adjacency.has(start) : start !== null) throw new Error('Select an existing starting vertex; an empty graph has no start.')
  const vertices = new Map(graph.vertices.map(v => [v.id, v])), edges = new Map(graph.edges.map(e => [e.id, e]))
  const label = (id: VertexId) => vertices.get(id)!.label
  const heap = new MinHeap<QueueEntry>((a,b) => a.distance-b.distance || compareLabels(vertices.get(a.vertex)!,vertices.get(b.vertex)!) || Number(a.vertex.slice(1))-Number(b.vertex.slice(1)) || a.sequence-b.sequence)
  const distances: Partial<Record<VertexId, number>> = Object.fromEntries(graph.vertices.map(v => [v.id, Infinity]))
  const parents: Partial<Record<VertexId, VertexId | null>> = Object.fromEntries(graph.vertices.map(v => [v.id, null]))
  const predecessorEdges: Partial<Record<VertexId, EdgeId>> = {}, finalized = new Set<VertexId>()
  let sequence = 0, active: VertexId | null = null, neighbor: VertexId | null = null, inspectedEdge: EdgeId | null = null
  let extracted: QueueEntry | null = null, inserted: QueueEntry | null = null, comparison: Relaxation | null = null
  function emit(kind: DijkstraKind, explanation: string) {
    if (!observe) return
    observe({ kind, explanation, start, active, neighbor, inspectedEdge, distances, parents, predecessorEdges, finalized: [...finalized], heap: heap.snapshot(), extracted, inserted, comparison,
      treeEdges: Object.values(predecessorEdges).filter((id): id is EdgeId => id !== undefined), unreachable: kind === 'complete' ? [...graph.vertices].sort(compareLabels).filter(v => distances[v.id] === Infinity).map(v => v.id) : [] })
  }
  emit('initialize', 'Initialize all distances to ∞ (no known route) and all predecessors to none. No vertices are finalized.')
  if (start !== null) distances[start] = 0
  emit('source', start === null ? 'The graph is empty; there is no source to initialize.' : `Set distance(${label(start)}) = 0. Reaching the source costs nothing.`)
  emit('queue-init', 'Initialize an empty binary min-heap. Lowest distance wins; ties use vertex label, stable ID, then insertion order.')
  if (start !== null) {
    inserted = { vertex:start, distance:0, sequence:sequence++ }; heap.push(inserted)
    emit('enqueue-start', `Insert ${label(start)} with priority 0.`); inserted = null
  }
  while (heap.size) {
    active = null; neighbor = null; inspectedEdge = null; comparison = null; extracted = null
    emit('loop', 'The priority queue is not empty. Extract its minimum-priority candidate next.')
    extracted = heap.pop()!; active = extracted.vertex
    emit('extract', `Extract ${label(active)} with queued priority ${extracted.distance}. Check this entry before finalizing anything.`)
    emit('stale-check', `Compare queued priority ${extracted.distance} with distance(${label(active)}) = ${distances[active]}. Also check whether this vertex is already finalized.`)
    if (extracted.distance !== distances[active] || finalized.has(active)) {
      emit('stale', `Ignore this stale ${label(active)} entry. A newer shorter candidate superseded it or the vertex was already finalized.`)
      continue
    }
    finalized.add(active)
    emit('finalize', `Finalize ${label(active)} at cost ${distances[active]}. With nonnegative weights, no later candidate can provide a shorter route.`)
    for (const entry of adjacency.get(active)!) {
      neighbor = entry.vertex; inspectedEdge = entry.edge; comparison = null
      const weight = edges.get(entry.edge)!.weight
      emit('inspect', `Inspect ${label(active)} ${graph.directed ? '→' : '—'} ${label(neighbor)} with weight ${weight}.`)
      comparison = { from: active, to: neighbor, weight, base: distances[active]!, alternative: distances[active]! + weight, previous: distances[neighbor]! }
      emit('calculate', `${label(active)} → ${label(neighbor)}: ${comparison.base} + ${weight} = ${comparison.alternative}. The existing distance is ${distanceText(comparison.previous)}.`)
      emit('compare', `Is ${comparison.alternative} strictly less than ${distanceText(comparison.previous)}? Equal-cost routes keep the existing predecessor.`)
      if (comparison.alternative < comparison.previous) {
        distances[neighbor] = comparison.alternative
        emit('relax', `A shorter route was found: update distance(${label(neighbor)}) from ${distanceText(comparison.previous)} to ${comparison.alternative}. Its predecessor update is the next step.`)
        parents[neighbor] = active; predecessorEdges[neighbor] = entry.edge
        emit('predecessor', `Set predecessor(${label(neighbor)}) = ${label(active)}. Replace its old predecessor edge with this one; this route is still tentative.`)
        inserted = { vertex:neighbor, distance:distances[neighbor]!, sequence:sequence++ }; heap.push(inserted)
        emit('enqueue', `Insert a new ${label(neighbor)} candidate with priority ${inserted.distance}. Older entries stay in the heap and will be skipped when extracted.`)
        inserted = null
      } else emit('skip', `${comparison.alternative} is not less than ${distanceText(comparison.previous)}. Keep ${label(neighbor)}’s distance and predecessor unchanged${finalized.has(neighbor) ? '; this vertex is already finalized' : ''}.`)
    }
  }
  active = null; neighbor = null; inspectedEdge = null; comparison = null; extracted = null
  emit('complete', 'The priority queue is empty. All reachable vertices have final shortest distances. Vertices still at ∞ are unreachable.')
  return { distances:{...distances}, parents:{...parents}, predecessorEdges:{...predecessorEdges}, finalized:[...finalized] }
}
