import { buildAdjacency } from './graphAdjacency'
import { compareLabels, type EdgeId, type Graph, type VertexId } from './graphModel'

export type DFSKind = 'initialize' | 'start-call' | 'enter' | 'discover' | 'visit' | 'inspect' | 'check' | 'recurse' | 'skip' | 'return' | 'finish' | 'backtrack' | 'complete'
export interface DFSFrame { readonly vertex: VertexId; readonly parent: VertexId | null; readonly via: EdgeId | null }
export interface DFSReturn { readonly vertex: VertexId; readonly caller: VertexId | null; readonly edge: EdgeId | null }
export interface DFSEvent {
  readonly kind: DFSKind
  readonly explanation: string
  readonly start: VertexId | null
  readonly active: VertexId | null
  readonly neighbor: VertexId | null
  readonly inspectedEdge: EdgeId | null
  readonly discovered: readonly VertexId[]
  readonly order: readonly VertexId[]
  readonly processed: readonly VertexId[]
  readonly parents: Readonly<Partial<Record<VertexId, VertexId | null>>>
  readonly stack: readonly DFSFrame[]
  readonly returned: DFSReturn | null
  readonly treeEdges: readonly EdgeId[]
  readonly unreachable: readonly VertexId[]
}

/** Real recursive calls emit events. Only the trace recorder copies/finalizes snapshots. */
export function depthFirstSearch(graph: Graph, start: VertexId | null, observe?: (event: DFSEvent) => void) {
  const adjacency = buildAdjacency(graph)
  if (graph.vertices.length ? start === null || !adjacency.has(start) : start !== null) throw new Error('Select an existing starting vertex; an empty graph has no start.')
  const labels = new Map(graph.vertices.map(v => [v.id, v.label]))
  const label = (id: VertexId) => labels.get(id)!
  const discovered = new Set<VertexId>(), order: VertexId[] = [], processed: VertexId[] = [], treeEdges: EdgeId[] = [], stack: DFSFrame[] = []
  const parents: Partial<Record<VertexId, VertexId | null>> = {}
  let active: VertexId | null = null, neighbor: VertexId | null = null, inspectedEdge: EdgeId | null = null, returned: DFSReturn | null = null
  function emit(kind: DFSKind, explanation: string) {
    if (!observe) return
    observe({ kind, explanation, start, active, neighbor, inspectedEdge, discovered: [...discovered], order, processed, parents, stack, returned, treeEdges,
      unreachable: kind === 'complete' ? [...graph.vertices].sort(compareLabels).filter(v => !discovered.has(v.id)).map(v => v.id) : [] })
  }
  // Called by the caller only AFTER visit() has returned. Finished nodes are never on the stack.
  function recordReturn(vertex: VertexId, caller: VertexId | null, edge: EdgeId | null) {
    active = caller; neighbor = null; inspectedEdge = null
    returned = { vertex, caller, edge }; processed.push(vertex)
    emit('finish', `DFS(${label(vertex)}) has returned. Remove its call frame and record ${label(vertex)} as fully processed.${caller ? ` DFS(${label(caller)}) is now the executing call.` : ' The recursion stack is empty.'}`)
    if (caller !== null) emit('backtrack', `Backtrack from ${label(vertex)} to ${label(caller)}. Resume ${label(caller)}’s neighbor loop after the completed child call. This is a return of control, not traversal of a reverse graph edge.`)
    returned = null
  }
  function visit(vertex: VertexId, parent: VertexId | null, via: EdgeId | null) {
    stack.push({ vertex, parent, via }); active = vertex; neighbor = null; inspectedEdge = null
    emit('enter', `Enter DFS(${label(vertex)}). Push its call frame; its first instruction will mark it discovered.`)
    discovered.add(vertex); parents[vertex] = parent
    if (via !== null) treeEdges.push(via)
    emit('discover', `Mark ${label(vertex)} discovered at the beginning of its call.${parent ? ` Record parent ${label(parent)} and the DFS tree edge.` : ' It is the start and has no parent.'} Later edges cannot visit it again.`)
    order.push(vertex)
    emit('visit', `Visit ${label(vertex)} and append it to discovery order. Its recursive call remains active until all outgoing neighbors are checked.`)
    for (const entry of adjacency.get(vertex)!) {
      neighbor = entry.vertex; inspectedEdge = entry.edge
      emit('inspect', `Inspect ${label(vertex)} ${graph.directed ? '→' : '—'} ${label(neighbor)} in alphabetical neighbor order.`)
      emit('check', `Has ${label(neighbor)} already been discovered?`)
      if (!discovered.has(neighbor)) {
        emit('recurse', `${label(neighbor)} is undiscovered. Call DFS(${label(neighbor)}) now; DFS(${label(vertex)}) waits until that entire branch returns.`)
        visit(entry.vertex, vertex, entry.edge)
        recordReturn(entry.vertex, vertex, entry.edge)
      } else emit('skip', `${label(neighbor)} is already discovered. Skip it, whether its call is still on the stack or already finished. This prevents repeated visits through cycles.`)
    }
    neighbor = null; inspectedEdge = null
    emit('return', `${label(vertex)} has no remaining neighbors to inspect. Return from DFS(${label(vertex)}); this snapshot shows its final instruction before the frame is removed.`)
    stack.pop()
  }
  emit('initialize', 'Initialize discovered vertices, discovery order, completion order, and parents. The recursion stack is empty; only reachable vertices will be explored.')
  if (start !== null) {
    emit('start-call', `Call DFS(${label(start)}) from the traversal driver.`)
    visit(start, null, null)
    recordReturn(start, null, null)
  }
  emit('complete', start === null ? 'The graph is empty. No DFS call is needed.' : 'DFS is complete. All recursive calls have returned and the stack is empty. Undiscovered vertices are unreachable from this start.')
  return { order: [...order], processed: [...processed], parents: { ...parents } }
}
