import { insertBST } from '../bst/bstInsert'
import type { AVLContext } from './avlContext'
import { rebalancePath } from './avlRebalance'

export function insertAVL(ctx: AVLContext, value: number) {
  insertBST(ctx, value)
  rebalancePath(ctx, [...ctx.path, ctx.newId!])
}
