import type { TreeNodeId } from '../treeModel'
import type { AVLContext } from './avlContext'

/** Mirror-image rotations. Each write preserves an acyclic forest, with held references. */
export function rotate(ctx: AVLContext, root: TreeNodeId, parent: TreeNodeId | null, direction: 'left' | 'right', part: string): TreeNodeId {
  const side = direction === 'left' ? 'right' : 'left'
  const opposite = direction === 'left' ? 'left' : 'right'
  const pivot = ctx.nodes[root]![side]!
  const transfer = ctx.nodes[pivot]![opposite]
  const incoming = parent === null ? 'root' : ctx.nodes[parent]!.left === root ? 'left' : 'right'
  ctx.rotation = { direction, root, pivot, transfer, parent, part }
  ctx.current = root
  ctx.emit(direction === 'left' ? 'left-rotation' : 'right-rotation', `${part}: rotate ${direction} at ${ctx.label(root)}. Pivot ${ctx.label(pivot)} rises; ${ctx.label(transfer)} is the middle subtree that must be preserved.`)
  ctx.write(root, side, null, 'rotation-detach-pivot', `Detach ${root}.${side}; retain pivot ${pivot} and its subtree locally.`)
  if (transfer !== null) ctx.write(pivot, opposite, null, 'rotation-detach-transfer', `Detach ${pivot}.${opposite}; retain middle subtree ${transfer} locally.`)
  if (transfer !== null) ctx.write(root, side, transfer, 'rotation-transfer', `Move middle subtree ${transfer} to ${root}.${side}; its values still lie between the two rotating nodes.`)
  ctx.write(parent ?? 'ROOT', incoming, pivot, 'rotation-parent', `Reconnect ${parent === null ? 'ROOT' : `${parent}.${incoming}`} to pivot ${pivot}. Hold old subtree root ${root} locally.`)
  ctx.write(pivot, opposite, root, 'rotation-attach-root', `Connect ${pivot}.${opposite} to ${root}. Every subtree is reattached; inorder ordering is preserved.`)
  ctx.updateHeight(root)
  ctx.updateHeight(pivot)
  ctx.current = pivot
  ctx.emit('rotation-done', `${part} complete. ${ctx.label(pivot)} is the rotated subtree root; both affected heights have been recalculated.`)
  return pivot
}
