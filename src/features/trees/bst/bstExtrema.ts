import type { TreeNodeId } from '../treeModel'
import { BSTContext } from './bstContext'
export function extremeBST(ctx: BSTContext, kind: 'minimum' | 'maximum') {
  const side = kind === 'minimum' ? 'left' : 'right'
  ctx.current = ctx.root
  ctx.emit('start', `Start at ROOT to find the ${kind}. Follow ${side} references.`)
  if (ctx.current === null) { ctx.outcome = 'empty'; ctx.emit('empty', `The BST is empty; there is no ${kind}.`); return }
  while (true) {
    const id: TreeNodeId = ctx.current!
    ctx.examine(id)
    const child: TreeNodeId | null = ctx.nodes[id]![side]
    ctx.emit('extreme-check', `Check ${id}.${side}: ${ctx.label(child)}. ${child === null ? 'Stop here.' : `Continue ${side}.`}`, { source: id, side, target: child })
    if (child === null) break
    ctx.current = child
    ctx.emit(side === 'left' ? 'move-left' : 'move-right', `Follow ${id}.${side} to ${ctx.label(child)}.`, { source: id, side, target: child })
  }
  ctx.result = ctx.current
  ctx.outcome = 'found'
  ctx.emit('extreme-found', `The ${kind} is ${ctx.label(ctx.current)}. The BST is unchanged.`)
}
