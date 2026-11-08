import { buildAdjacency } from './graphAdjacency'
import { compareLabels, type EdgeId, type Graph, type VertexId } from './graphModel'

export type BFSKind = 'initialize' | 'queue-init' | 'start-discover' | 'start-enqueue' | 'loop' | 'dequeue' | 'visit' | 'inspect' | 'check' | 'discover' | 'record' | 'enqueue' | 'skip' | 'processed' | 'complete'
export interface BFSEvent {
  readonly kind: BFSKind
  readonly explanation: string
  readonly start: VertexId | null
  readonly active: VertexId | null
  readonly neighbor: VertexId | null
  readonly inspectedEdge: EdgeId | null
  readonly queue: readonly VertexId[]
  readonly discovered: readonly VertexId[]
  readonly order: readonly VertexId[]
  readonly processed: readonly VertexId[]
  readonly parents: Readonly<Partial<Record<VertexId, VertexId | null>>>
  readonly distances: Readonly<Partial<Record<VertexId, number>>>
  readonly treeEdges: readonly EdgeId[]
  readonly unreachable: readonly VertexId[]
}
/** Observer data is transient; the trace recorder owns immutable snapshot storage. */
export function breadthFirstSearch(graph: Graph, start: VertexId | null, observe?: (event: BFSEvent) => void) {
  const adjacency = buildAdjacency(graph)
  if (graph.vertices.length ? start === null || !adjacency.has(start) : start !== null) throw new Error('Select an existing starting vertex; an empty graph has no start.')
  const labels = new Map(graph.vertices.map(v => [v.id, v.label]))
  const label = (id: VertexId) => labels.get(id)!
  const queue: VertexId[] = [], discovered = new Set<VertexId>(), order: VertexId[] = [], processed: VertexId[] = [], treeEdges: EdgeId[] = []
  const parents: Partial<Record<VertexId, VertexId | null>> = {}, distances: Partial<Record<VertexId, number>> = {}
  let front = 0, active: VertexId | null = null, neighbor: VertexId | null = null, inspectedEdge: EdgeId | null = null
  function emit(kind: BFSKind, explanation: string) {
    if (!observe) return
    observe({ kind, explanation, start, active, neighbor, inspectedEdge, queue: queue.slice(front), discovered: [...discovered], order, processed, parents, distances, treeEdges,
      unreachable: kind === 'complete' ? [...graph.vertices].sort(compareLabels).filter(v => !discovered.has(v.id)).map(v => v.id) : [] })
  }
  emit('initialize', 'Initialize discovery, parent, distance, and visit records. Only the component reachable from the start will be explored.')
  emit('queue-init', 'Initialize an empty FIFO queue: remove from the front and add at the rear.')
  if (start !== null) {
    discovered.add(start); parents[start] = null; distances[start] = 0
    emit('start-discover', `Mark ${label(start)} discovered with distance 0 and no parent. It is reserved for the next enqueue step.`)
    queue.push(start)
    emit('start-enqueue', `Enqueue ${label(start)} at the rear. It is also the front of this one-item queue.`)
    while (front < queue.length) {
      emit('loop', 'The queue is not empty. Process its front vertex next.')
      active = queue[front++]
      emit('dequeue', `Dequeue ${label(active)} from the front. It is active, but has not been added to the visit order yet.`)
      order.push(active)
      emit('visit', `Visit ${label(active)} at distance ${distances[active]}. Add it to the output, then inspect its neighbors alphabetically.`)
      for (const entry of adjacency.get(active)!) {
        neighbor = entry.vertex; inspectedEdge = entry.edge
        emit('inspect', `Inspect ${label(active)} ${graph.directed ? '→' : '—'} ${label(neighbor)}.`)
        emit('check', `Has ${label(neighbor)} already been discovered?`)
        if (!discovered.has(neighbor)) {
          discovered.add(neighbor)
          emit('discover', `Discover ${label(neighbor)} now, before enqueueing it, so another edge cannot add it twice.`)
          parents[neighbor] = active; distances[neighbor] = distances[active]! + 1; treeEdges.push(entry.edge)
          emit('record', `Record parent(${label(neighbor)}) = ${label(active)} and distance = ${distances[neighbor]}. This edge joins the BFS traversal tree.`)
          queue.push(neighbor)
          emit('enqueue', `Enqueue ${label(neighbor)} at the rear. Earlier discoveries stay ahead of it.`)
        } else emit('skip', `${label(neighbor)} is already discovered. Keep its original parent and distance; do not enqueue it again.`)
      }
      neighbor = null; inspectedEdge = null; processed.push(active)
      emit('processed', `Finish ${label(active)}: all of its outgoing neighbors have been inspected.`)
      active = null
    }
  }
  emit('complete', start === null ? 'The graph is empty. There is no starting vertex or traversal.' : 'The queue is empty. Every reachable vertex has been processed once. Undiscovered vertices are unreachable from this start.')
  return { order: [...order], parents: { ...parents }, distances: { ...distances } }
}
