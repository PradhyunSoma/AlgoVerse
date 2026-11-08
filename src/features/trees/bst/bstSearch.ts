import type { TreeNodeId } from '../treeModel'
import { BSTContext } from './bstContext'

/** Shared comparison walk for insertion, search, and deletion. */
export function locateBST(ctx: BSTContext, value: number) {
  let parent: TreeNodeId | null = null
  let side: 'left' | 'right' = 'left'
  ctx.current = ctx.root
  ctx.emit('start', `Start at ROOT → ${ctx.label(ctx.root)}. Look for ${value}.`)
  while (ctx.current !== null) {
    const id = ctx.current
    const node = ctx.nodes[id]!
    ctx.examine(id)
    ctx.emit('compare', `Compare ${value} with ${ctx.label(id)}: ${value === node.value ? 'equal' : value < node.value ? `${value} < ${node.value}` : `${value} > ${node.value}`}.`)
    if (value === node.value) return { id, parent, side }
    parent = id
    ctx.locals.parent = parent
    side = value < node.value ? 'left' : 'right'
    ctx.current = node[side]
    ctx.emit(side === 'left' ? 'move-left' : 'move-right', `Move ${side} to ${ctx.label(ctx.current)}. ${side === 'left' ? 'Larger' : 'Smaller'} values in the other subtree cannot match ${value}.`, { source: id, side, target: node[side] })
  }
  return { id: null, parent, side }
}
export function searchBST(ctx: BSTContext, value: number) {
  const { id } = locateBST(ctx, value)
  ctx.result = id
  ctx.outcome = id === null ? 'missing' : 'found'
  ctx.emit(id === null ? 'missing' : 'found', id === null ? `${value} was not found: the search reached NULL. The BST is unchanged.` : `Found ${value} at ${id}. The BST is unchanged.`)
}
