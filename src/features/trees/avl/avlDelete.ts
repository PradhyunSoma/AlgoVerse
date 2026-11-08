import { deleteBST } from '../bst/bstDelete'
import type { AVLContext } from './avlContext'
import { rebalancePath } from './avlRebalance'

export function deleteAVL(ctx: AVLContext, value: number) {
  deleteBST(ctx, value)
  if (ctx.outcome !== 'deleted') return
  // The successor moved into the target's place. Repair its former ancestors
  // first, then the successor, then the ancestors above the deleted target.
  const path = ctx.path.filter((id) => id !== ctx.successor)
  if (ctx.successor !== null) path.splice(ctx.deletionPath.length - 1, 0, ctx.successor)
  rebalancePath(ctx, path)
}
