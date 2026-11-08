import type { PseudocodeLine } from '../../../components/PseudocodePanel'
import { bstCode } from '../bst/bstCode'
import type { BSTOperationKind } from '../bst/bstContext'
import type { AVLEventKind } from './avlContext'

export function avlCode(kind: BSTOperationKind): readonly PseudocodeLine<AVLEventKind>[] {
  const base = bstCode(kind).filter((line) => line.id !== 'complete').map((line) => line.id === 'allocate'
    ? { ...line, text: 'newNode = Node(value, NULL, NULL, height = 1)' } : line)
  const line = (id: AVLEventKind, text: string, indent = 0) => ({ id, text, indent })
  if (kind !== 'insert' && kind !== 'delete') return [...base, line('complete', 'return result // AVL tree unchanged')]
  return [...base,
    line('return-up', 'for node in affected path, deepest ancestor to ROOT:'),
    line('height', 'updateHeight(node): h = 1 + max(h(left), h(right))', 1),
    line('balance', 'BF = h(node.left) - h(node.right)', 1),
    line('balanced', 'if -1 <= BF <= 1: continue toward ROOT', 1),
    line('case-LL', 'if BF > 1 and BF(left) >= 0: rotateRight(node)', 1),
    line('case-RR', 'if BF < -1 and BF(right) <= 0: rotateLeft(node)', 1),
    line('case-LR', 'if BF > 1 and BF(left) < 0: rotateLeft(left); rotateRight(node)', 1),
    line('case-RL', 'if BF < -1 and BF(right) > 0: rotateRight(right); rotateLeft(node)', 1),
    line('left-rotation', 'rotateLeft(root): pivot = root.right; middle = pivot.left'),
    line('right-rotation', 'rotateRight(root): pivot = root.left; middle = pivot.right'),
    line('rotation-detach-pivot', 'root.pivotSide = NULL // hold pivot locally', 1),
    line('rotation-detach-transfer', 'if middle != NULL: pivot.innerSide = NULL // hold middle', 1),
    line('rotation-transfer', 'if middle != NULL: root.pivotSide = middle', 1),
    line('rotation-parent', 'ROOT or parent.child = pivot // hold old root locally', 1),
    line('rotation-attach-root', 'pivot.innerSide = root; updateHeight(root); updateHeight(pivot)', 1),
    line('rotation-done', 'return pivot // subtree reconnected; heights updated', 1),
    line('complete', 'validate BST order, heights, and AVL balance; save result'),
  ]
}
