import type { PseudocodeLine } from '../../../components/PseudocodePanel'
import type { BSTEventKind, BSTOperationKind } from './bstContext'
export function bstCode(kind: BSTOperationKind): readonly PseudocodeLine<BSTEventKind>[] {
  const line = (id: BSTEventKind, text: string, indent = 0) => ({ id, text, indent })
  const start = [line('ready', '// Apply an operation; reject invalid / duplicate input'), line('start', 'current = ROOT; parent = NULL')]
  if (kind === 'minimum' || kind === 'maximum') {
    const side = kind === 'minimum' ? 'left' : 'right'
    return [...start, line('empty', 'if current == NULL: return no result'),
      line('extreme-check', `while current.${side} != NULL:`), line(side === 'left' ? 'move-left' : 'move-right', `current = current.${side}`, 1),
      line('extreme-found', 'result = current'), line('complete', 'return result')]
  }
  const walk = [...start, line('compare', 'while current != NULL: compare value; stop on equality'),
    line('move-left', 'if value < current.data: parent = current; current = current.left', 1),
    line('move-right', 'else if value > current.data: parent = current; current = current.right', 1)]
  if (kind === 'search') return [...walk, line('found', 'if equal: return current'), line('missing', 'if current == NULL: return not found'), line('complete', '// search complete; tree unchanged')]
  if (kind === 'insert') return [...walk, line('slot', '// current is NULL: use ROOT or parent’s chosen slot'),
    line('allocate', 'newNode = Node(value, left = NULL, right = NULL)'), line('connect', 'ROOT or parent.child = newNode'), line('complete', 'return updated BST')]
  return [...walk, line('missing', 'if current == NULL: return unchanged'), line('target', 'target = current; save parent and its child slot'),
    line('leaf', 'if target has no children: replacement = NULL'),
    line('one-child', 'else if one child: replacement = target.left or target.right'),
    line('detach-child', 'target.child = NULL // hold replacement subtree locally', 1),
    line('two-children', 'else: // transplant successor; keep original node identities'),
    line('successor-start', 'successorParent = target; successor = target.right', 1),
    line('successor-check', 'while successor.left != NULL:', 1),
    line('successor-left', 'successorParent = successor; successor = successor.left', 2),
    line('successor-found', 'save target.left, target.right, successor.right; replacement = successor', 1),
    line('detach-successor-child', 'if successor.right: successor.right = NULL // child held locally', 1),
    line('bypass-successor', 'if successorParent != target: successorParent.left = saved successor.right', 1),
    line('detach-right', 'target.right = NULL // subtrees retained locally', 1),
    line('detach-left', 'target.left = NULL', 1),
    line('transplant', 'ROOT or parent.child = replacement'),
    line('attach-left', 'if two children: successor.left = saved target.left'),
    line('attach-right', 'successor.right = saved right subtree (excluding successor)', 1),
    line('remove', 'release target'), line('complete', 'validate and return updated BST')]
}
