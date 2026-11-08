import { dijkstra, type DijkstraEvent } from './dijkstra'
import { immutableGraph, type Graph, type VertexId } from './graphModel'
export interface DijkstraStep extends DijkstraEvent { readonly graph: Graph; readonly lineId: DijkstraEvent['kind'] }
export function createDijkstraTrace(input: Graph, start: VertexId | null): readonly DijkstraStep[] {
  const graph = immutableGraph(input), steps: DijkstraStep[] = []
  dijkstra(graph,start,event => steps.push(Object.freeze({ ...event,graph,lineId:event.kind,
    distances:Object.freeze({...event.distances}),parents:Object.freeze({...event.parents}),predecessorEdges:Object.freeze({...event.predecessorEdges}),
    finalized:Object.freeze([...event.finalized]),heap:Object.freeze(event.heap.map(entry=>Object.freeze({...entry}))),
    extracted:event.extracted ? Object.freeze({...event.extracted}) : null, inserted:event.inserted ? Object.freeze({...event.inserted}) : null,
    comparison:event.comparison ? Object.freeze({...event.comparison}) : null,treeEdges:Object.freeze([...event.treeEdges]),unreachable:Object.freeze([...event.unreachable]) })))
  return Object.freeze(steps)
}
