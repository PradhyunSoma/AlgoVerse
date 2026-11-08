import type { PseudocodeLine } from '../../components/PseudocodePanel'
import type { DijkstraKind } from './dijkstra'
export const dijkstraCode: readonly PseudocodeLine<DijkstraKind>[] = [
  {id:'initialize',text:'distance[all] = ∞; predecessor[all] = none',indent:0},
  {id:'source',text:'if source exists: distance[source] = 0',indent:0},
  {id:'queue-init',text:'queue = empty binary min-heap',indent:0},
  {id:'enqueue-start',text:'if source exists: push (source, 0)',indent:0},
  {id:'loop',text:'while queue is not empty:',indent:0},
  {id:'extract',text:'(current, priority) = extract minimum',indent:1},
  {id:'stale-check',text:'if priority ≠ distance[current] or current finalized:',indent:1},
  {id:'stale',text:'skip this stale entry; continue',indent:2},
  {id:'finalize',text:'mark current finalized',indent:1},
  {id:'inspect',text:'for each outgoing neighbor (alphabetical):',indent:1},
  {id:'calculate',text:'alternative = distance[current] + edge.weight',indent:2},
  {id:'compare',text:'if alternative < distance[neighbor]:',indent:2},
  {id:'relax',text:'distance[neighbor] = alternative',indent:3},
  {id:'predecessor',text:'predecessor[neighbor] = current (and this edge)',indent:3},
  {id:'enqueue',text:'push (neighbor, alternative) into heap',indent:3},
  {id:'skip',text:'else: keep distance and predecessor',indent:2},
  {id:'complete',text:'return final distances and predecessor tree',indent:0},
]
