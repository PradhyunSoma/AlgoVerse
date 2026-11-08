import { depthFirstSearch, type DFSEvent } from './dfs'
import { immutableGraph, type Graph, type VertexId } from './graphModel'
export interface DFSStep extends DFSEvent { readonly graph: Graph; readonly lineId: DFSEvent['kind'] }
export function createDFSTrace(input: Graph, start: VertexId | null): readonly DFSStep[] {
  const graph = immutableGraph(input), steps: DFSStep[] = []
  depthFirstSearch(graph, start, event => steps.push(Object.freeze({ ...event, graph, lineId: event.kind,
    discovered: Object.freeze([...event.discovered]), order: Object.freeze([...event.order]), processed: Object.freeze([...event.processed]),
    parents: Object.freeze({ ...event.parents }), stack: Object.freeze(event.stack.map(frame => Object.freeze({ ...frame }))),
    returned: event.returned ? Object.freeze({ ...event.returned }) : null,
    treeEdges: Object.freeze([...event.treeEdges]), unreachable: Object.freeze([...event.unreachable]) })))
  return Object.freeze(steps)
}
