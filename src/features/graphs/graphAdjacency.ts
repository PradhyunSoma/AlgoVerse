import { compareLabels, validateGraph, type EdgeId, type Graph, type VertexId } from './graphModel'
export interface Neighbor { readonly vertex: VertexId; readonly edge: EdgeId }
export type Adjacency = ReadonlyMap<VertexId, readonly Neighbor[]>
/** Alphabetical ASCII label order, independent of edge/vertex input order. Built once before traversal. */
export function buildAdjacency(graph: Graph): Adjacency {
  validateGraph(graph)
  const labels = new Map(graph.vertices.map(v => [v.id, v]))
  const adjacency = new Map<VertexId, Neighbor[]>(graph.vertices.map(v => [v.id, []]))
  for (const edge of graph.edges) {
    adjacency.get(edge.source)!.push({ vertex: edge.destination, edge: edge.id })
    if (!graph.directed) adjacency.get(edge.destination)!.push({ vertex: edge.source, edge: edge.id })
  }
  for (const neighbors of adjacency.values()) {
    neighbors.sort((a, b) => compareLabels(labels.get(a.vertex)!, labels.get(b.vertex)!))
    neighbors.forEach(Object.freeze)
    Object.freeze(neighbors)
  }
  return adjacency
}
