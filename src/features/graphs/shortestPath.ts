import type { DijkstraStep } from './dijkstraTrace'
import type { EdgeId, VertexId } from './graphModel'
export type PathResult = { readonly status: 'ready'; readonly vertices: readonly VertexId[]; readonly edges: readonly EdgeId[]; readonly cost: number }
  | { readonly status: 'pending' | 'unreachable' | 'empty' | 'invalid'; readonly message: string }
/** Reconstruct only finalized destinations; validate direction, cost, and cycles defensively. */
export function reconstructPath(step: DijkstraStep, destination: VertexId | null): PathResult {
  if (step.start === null || destination === null) return { status:'empty',message:'Choose a source and destination in a nonempty graph.' }
  if (!step.graph.vertices.some(v=>v.id===destination)) return {status:'invalid',message:'The destination is not in the current graph.'}
  if (!step.finalized.includes(destination)) return step.kind === 'complete'
    ? {status:'unreachable',message:'No path exists from the source to this destination.'}
    : {status:'pending',message:'This destination is not finalized yet. Its tentative route is not a shortest-path answer.'}
  const vertices: VertexId[] = [], edges: EdgeId[] = [], seen = new Set<VertexId>()
  let current = destination, cost = 0
  while (true) {
    if (seen.has(current) || !step.finalized.includes(current)) return {status:'invalid',message:'The predecessor chain is cyclic or incomplete.'}
    seen.add(current); vertices.push(current)
    if (current === step.start) break
    const parent = step.parents[current], edge = step.graph.edges.find(e=>e.id===step.predecessorEdges[current])
    if (!parent || !edge || !(edge.source===parent && edge.destination===current || !step.graph.directed && edge.destination===parent && edge.source===current)) return {status:'invalid',message:'The predecessor chain has an invalid edge.'}
    cost += edge.weight; edges.push(edge.id); current = parent
  }
  if (cost !== step.distances[destination]) return {status:'invalid',message:'The predecessor chain cost does not match the recorded distance.'}
  return {status:'ready',vertices:vertices.reverse(),edges:edges.reverse(),cost}
}
