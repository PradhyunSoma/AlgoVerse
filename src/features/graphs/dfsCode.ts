import type { PseudocodeLine } from '../../components/PseudocodePanel'
import type { DFSKind } from './dfs'
export const dfsCode: readonly PseudocodeLine<DFSKind>[] = [
  { id: 'initialize', text: 'initialize discovered, order, finished, parents', indent: 0 },
  { id: 'start-call', text: 'if start exists: DFS(start)', indent: 0 },
  { id: 'complete', text: 'report discovery order, finished, and unreachable', indent: 0 },
  { id: 'enter', text: 'DFS(vertex):  // enter a new call frame', indent: 0 },
  { id: 'discover', text: 'mark vertex discovered; record its parent', indent: 1 },
  { id: 'visit', text: 'append vertex to discovery order', indent: 1 },
  { id: 'inspect', text: 'for neighbor in alphabetical adjacency[vertex]:', indent: 1 },
  { id: 'check', text: 'if neighbor is not discovered:', indent: 2 },
  { id: 'recurse', text: 'DFS(neighbor)  // caller waits', indent: 3 },
  { id: 'backtrack', text: '// child returned: resume this neighbor loop', indent: 3 },
  { id: 'skip', text: 'else: skip the discovered neighbor', indent: 2 },
  { id: 'return', text: 'return  // no remaining neighbors', indent: 1 },
  { id: 'finish', text: '// on actual call exit: pop frame; record finished vertex', indent: 0 },
]
