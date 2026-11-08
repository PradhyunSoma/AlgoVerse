import { breadthFirstSearch, type BFSEvent } from './bfs'
import { immutableGraph, type Graph, type VertexId } from './graphModel'
export interface BFSStep extends BFSEvent { readonly graph: Graph; readonly lineId: BFSEvent['kind'] }
export function createBFSTrace(input: Graph, start: VertexId | null): readonly BFSStep[] {
  const graph = immutableGraph(input), steps: BFSStep[] = []
  breadthFirstSearch(graph, start, event => steps.push(Object.freeze({ ...event, graph, lineId: event.kind,
    queue: Object.freeze([...event.queue]), discovered: Object.freeze([...event.discovered]), order: Object.freeze([...event.order]),
    processed: Object.freeze([...event.processed]), parents: Object.freeze({ ...event.parents }), distances: Object.freeze({ ...event.distances }),
    treeEdges: Object.freeze([...event.treeEdges]), unreachable: Object.freeze([...event.unreachable]) })))
  return Object.freeze(steps)
}
