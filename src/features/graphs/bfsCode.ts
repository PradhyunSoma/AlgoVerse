import type { PseudocodeLine } from '../../components/PseudocodePanel'
import type { BFSKind } from './bfs'
export const bfsCode: readonly PseudocodeLine<BFSKind>[] = [
  { id: 'initialize', text: 'discovered, order, parents, distances = empty', indent: 0 },
  { id: 'queue-init', text: 'queue = empty FIFO queue', indent: 0 },
  { id: 'start-discover', text: 'if start exists: discover(start); distance[start] = 0; parent[start] = null', indent: 0 },
  { id: 'start-enqueue', text: '    enqueue(start)', indent: 0 },
  { id: 'loop', text: 'while queue is not empty:', indent: 0 },
  { id: 'dequeue', text: 'current = dequeue front', indent: 1 },
  { id: 'visit', text: 'append current to visit order', indent: 1 },
  { id: 'inspect', text: 'for neighbor in alphabetical adjacency[current]:', indent: 1 },
  { id: 'check', text: 'if neighbor is not discovered:', indent: 2 },
  { id: 'discover', text: 'mark neighbor discovered', indent: 3 },
  { id: 'record', text: 'parent[neighbor] = current; distance[neighbor] = distance[current] + 1', indent: 3 },
  { id: 'enqueue', text: 'enqueue neighbor at rear', indent: 3 },
  { id: 'skip', text: 'else: skip (already discovered)', indent: 2 },
  { id: 'processed', text: 'mark current fully processed', indent: 1 },
  { id: 'complete', text: 'return order, parents, distances, unreachable vertices', indent: 0 },
]
