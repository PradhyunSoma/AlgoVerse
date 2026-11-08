import type { PseudocodeLine } from '../../components/PseudocodePanel'
import type { TraversalKind, TreeEventKind } from './treeTraversals'
export function treeCode(traversal: TraversalKind): readonly PseudocodeLine<TreeEventKind>[] {
  const line = (id: TreeEventKind, text: string, indent = 0) => ({ id, text, indent })
  if (traversal === 'level-order') return [
    line('start', 'output = []'), line('queue-init', 'queue = [ROOT] if ROOT != NULL else []'),
    line('queue-check', 'while queue is not empty:'), line('dequeue', 'node = queue.pop_front()', 1),
    line('visit', 'output.append(node.data)', 1), line('enqueue-left', 'if node.left != NULL: queue.push_back(node.left)', 1),
    line('enqueue-right', 'if node.right != NULL: queue.push_back(node.right)', 1),
    line('processed', '// node processed; continue with the queue', 1), line('complete', 'return output'),
  ]
  const visit = line('visit', 'output.append(node.data)', 1)
  return [line('start', 'output = []; traverse(ROOT)'), line('enter', 'function traverse(node):'),
    line('base-check', 'if node == NULL:', 1), line('base-return', 'return', 2),
    ...(traversal === 'preorder' ? [visit] : []),
    line('call-left', 'traverse(node.left)', 1), line('resume-left', '// left call returned; resume here', 1),
    ...(traversal === 'inorder' ? [visit] : []),
    line('call-right', 'traverse(node.right)', 1), line('resume-right', '// right call returned; resume here', 1),
    ...(traversal === 'postorder' ? [visit] : []),
    line('return', 'return // this subtree is complete', 1), line('complete', '// root call returned; output is complete')]
}
