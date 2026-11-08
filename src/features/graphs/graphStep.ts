import type { DijkstraStep } from './dijkstraTrace'
import type { VertexId } from './graphModel'
import type { BFSStep } from './bfsTrace'
import type { DFSStep } from './dfsTrace'
export type TraversalStep = BFSStep | DFSStep
export type GraphStep = TraversalStep | DijkstraStep
export const isDijkstraStep = (step: GraphStep): step is DijkstraStep => 'heap' in step
export const isDFSStep = (step: GraphStep): step is DFSStep => 'stack' in step

export function vertexState(step: GraphStep, id: string): string {
  if (isDijkstraStep(step)) {
    if (step.finalized.some(vertex => vertex === id)) return 'Finalized'
    if (step.active === id) return 'Active candidate'
    if (Number.isFinite(step.distances[id as VertexId])) return 'Tentative'
    return step.kind === 'complete' ? 'Unreachable' : 'Unvisited'
  }
  if (step.processed.some(vertex => vertex === id)) return 'Processed'
  if (isDFSStep(step)) {
    if (step.active === id) return step.kind === 'enter' ? 'Entering' : step.kind === 'return' ? 'Returning' : 'Active'
    if (step.stack.some(frame => frame.vertex === id)) return 'On stack'
  } else {
    if (step.active === id) return 'Active'
    if (step.queue.some(vertex => vertex === id)) return 'Queued'
  }
  return step.discovered.some(vertex => vertex === id) ? 'Discovered' : step.kind === 'complete' ? 'Unreachable' : isDFSStep(step) ? 'Undiscovered' : 'Unvisited'
}
