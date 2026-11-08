import { MAX_TREE_NODES } from '../treeModel'
import type { BSTOperation } from '../bst/bstContext'
import { assertBSTValue } from '../bst/bstModel'
import { searchBST } from '../bst/bstSearch'
import { extremeBST } from '../bst/bstExtrema'
import { AVLContext, type AVLEvent } from './avlContext'
import { assertAVL, emptyAVL, freezeAVL, AVL_SAMPLE, type AVLTree } from './avlModel'
import { insertAVL } from './avlInsert'
import { deleteAVL } from './avlDelete'

export function runAVLOperation(input: AVLTree, operation: BSTOperation, observe?: (event: AVLEvent, tree: AVLTree) => void): AVLTree {
  assertAVL(input)
  if ('value' in operation) assertBSTValue(operation.value)
  if (operation.kind === 'insert') {
    if (Object.values(input.nodes).some((node) => node!.value === operation.value)) throw new RangeError(`${operation.value} already exists. Duplicate insertions are not allowed.`)
    if (Object.keys(input.nodes).length >= MAX_TREE_NODES) throw new RangeError(`The AVL tree is full (maximum ${MAX_TREE_NODES} nodes).`)
  }
  const ctx = new AVLContext(input, observe)
  if (operation.kind === 'insert') insertAVL(ctx, operation.value)
  else if (operation.kind === 'delete') deleteAVL(ctx, operation.value)
  else if (operation.kind === 'search') searchBST(ctx, operation.value)
  else extremeBST(ctx, operation.kind)
  assertAVL(ctx.state())
  ctx.locals = {}; ctx.ancestors = []; ctx.rotation = null; ctx.imbalance = null
  ctx.current = ctx.result
  ctx.emit('complete', `Operation complete: ${ctx.outcome}.${ctx.result !== null ? ` Result: ${ctx.label(ctx.result)}.` : ''} BST order, reachability, heights, and AVL balance are valid.`)
  return freezeAVL(ctx.state())
}
export function createAVL(values: readonly number[] = AVL_SAMPLE, nextId = 1): AVLTree {
  let tree = emptyAVL(nextId)
  for (const value of values) tree = runAVLOperation(tree, { kind: 'insert', value })
  assertAVL(tree)
  return tree
}
