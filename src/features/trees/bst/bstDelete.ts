import { BSTContext } from './bstContext'
import { locateBST } from './bstSearch'
export function deleteBST(ctx: BSTContext, value: number) {
  const { id, parent, side } = locateBST(ctx, value)
  if (id === null) { ctx.outcome = 'missing'; ctx.emit('missing', `${value} was not found. Nothing is deleted.`); return }
  const target = ctx.nodes[id]!
  ctx.target = id
  ctx.locals.target = id
  ctx.emit('target', `Hold deletion target ${ctx.label(id)} locally and inspect its children.`)
  if (target.left === null || target.right === null) {
    const child = target.left ?? target.right
    ctx.locals.child = child
    ctx.emit(child === null ? 'leaf' : 'one-child', child === null ? 'The target is a leaf. Its incoming reference will become NULL.' : `The target has one child, ${ctx.label(child)}. Promote that child with its entire subtree.`)
    if (child !== null) ctx.write(id, target.left !== null ? 'left' : 'right', null, 'detach-child', `Detach the child subtree from ${id}, keeping it in the local child reference. It will be reconnected next.`)
    ctx.write(parent ?? 'ROOT', parent === null ? 'root' : side, child, 'transplant', `Redirect ${parent === null ? 'ROOT' : `${parent}.${side}`} to ${ctx.label(child)}. The target is now detached and held locally.`)
  } else {
    ctx.emit('two-children', 'The target has two children. Transplant the smallest node in its right subtree; do not copy or change node values.')
    let successorParent = id
    let successor = target.right
    ctx.current = successor
    ctx.locals.successorParent = successorParent
    ctx.emit('successor-start', `Enter the right subtree at ${ctx.label(successor)} to find the inorder successor.`, { source: id, side: 'right', target: successor })
    while (true) {
      ctx.successor = successor
      ctx.locals.successor = successor
      ctx.examine(successor)
      const left = ctx.nodes[successor]!.left
      ctx.emit('successor-check', `Check ${successor}.left: ${ctx.label(left)}. ${left === null ? 'This node is the smallest in the right subtree.' : 'Keep moving left.'}`, { source: successor, side: 'left', target: left })
      if (left === null) break
      successorParent = successor
      ctx.locals.successorParent = successorParent
      successor = left
      ctx.current = successor
      ctx.emit('successor-left', `Move left to ${ctx.label(successor)}.`, { source: successorParent, side: 'left', target: successor })
    }
    ctx.emit('successor-found', `Successor ${ctx.label(successor)} is greater than every value in the target's left subtree and no greater than any other value in its right subtree. It has no left child.`)
    const child = ctx.nodes[successor]!.right
    ctx.locals.child = child
    ctx.locals.leftSubtree = target.left
    ctx.locals.rightSubtree = successorParent === id ? child : target.right
    if (child !== null) ctx.write(successor, 'right', null, 'detach-successor-child', `Detach the successor's right subtree ${ctx.label(child)}, held in child. It must not be discarded.`)
    if (successorParent !== id) ctx.write(successorParent, 'left', child, 'bypass-successor', `Bypass successor ${successor}: ${successorParent}.left now points to ${ctx.label(child)}. The successor is held locally.`)
    // Detach first: every intermediate graph remains an acyclic forest with at most one parent per node.
    ctx.write(id, 'right', null, 'detach-right', `Detach the target's right reference. The right subtree and successor remain held locally${successorParent === id ? '; the successor is the immediate right child' : ''}.`)
    ctx.write(id, 'left', null, 'detach-left', `Detach the target's left subtree ${ctx.label(target.left)} and retain it in leftSubtree.`)
    ctx.write(parent ?? 'ROOT', parent === null ? 'root' : side, successor, 'transplant', `Replace the target's incoming reference with successor ${successor}. Its ID and value are unchanged; its subtrees are attached next.`)
    ctx.write(successor, 'left', target.left, 'attach-left', `Attach leftSubtree ${target.left} to ${successor}.left.`)
    const right = successorParent === id ? child : target.right
    if (right !== null) ctx.write(successor, 'right', right, 'attach-right', `Attach ${right} to ${successor}.right${successorParent === id ? ', preserving the successor’s original right subtree' : ''}.`)
  }
  delete ctx.nodes[id]
  ctx.current = null
  for (const key of Object.keys(ctx.locals) as (keyof typeof ctx.locals)[]) if (ctx.locals[key] === id) ctx.locals[key] = null
  ctx.target = null
  ctx.path = ctx.path.filter((entry) => entry !== id)
  ctx.examined = ctx.examined.filter((entry) => entry !== id)
  ctx.outcome = 'deleted'
  ctx.emit('remove', `Release ${id}, the deleted node. Every other node retains its original ID and value.`)
}
