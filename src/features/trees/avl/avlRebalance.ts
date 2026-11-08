import type { TreeNodeId } from '../treeModel'
import type { AVLContext } from './avlContext'
import { balanceFactor, height, type RotationCase } from './avlModel'
import { rotate } from './avlRotations'

/** Only the affected root-to-mutation path is repaired, bottom-up (O(h)). */
export function rebalancePath(ctx: AVLContext, path: TreeNodeId[]) {
  ctx.locals = {}
  for (let index = path.length - 1; index >= 0; index -= 1) {
    const id = path[index], parent = index ? path[index - 1] : null
    ctx.ancestors = path.slice(0, index + 1)
    ctx.path = [...ctx.ancestors]
    ctx.current = id
    ctx.rotation = null; ctx.imbalance = null
    ctx.emit('return-up', `Return up the affected path to ${ctx.label(id)}. Update its height and check balance before continuing toward ROOT.`)
    ctx.updateHeight(id)
    const tree = ctx.state(), node = ctx.nodes[id]!
    const bf = balanceFactor(tree, id)
    ctx.emit('balance', `BF(${ctx.label(id)}) = h(left) − h(right) = ${height(tree, node.left)} − ${height(tree, node.right)} = ${bf}. ${Math.abs(bf) <= 1 ? 'Within [-1, +1].' : 'This ancestor is unbalanced.'}`)
    if (Math.abs(bf) <= 1) { ctx.emit('balanced', `${ctx.label(id)} is balanced. Continue toward ROOT; deletion can require repairs at more than one ancestor.`); continue }
    const child = (bf > 1 ? node.left : node.right)!
    const childBF = balanceFactor(tree, child)
    const which: RotationCase = bf > 1 ? childBF >= 0 ? 'LL' : 'LR' : childBF <= 0 ? 'RR' : 'RL'
    const grandchild = ctx.nodes[child]![which === 'LL' || which === 'RL' ? 'left' : 'right']
    ctx.imbalance = { node: id, child, grandchild, balance: bf, childBalance: childBF, case: which }
    ctx.emit(`case-${which}`, `${which} case at ${ctx.label(id)} (BF ${bf}); child ${ctx.label(child)} has BF ${childBF}. ${which === 'LR' || which === 'RL' ? 'The child leans inward: first rotate the child to an outer configuration, then rotate this ancestor. A single outer rotation would leave the inward-heavy shape unbalanced.' : `Use one ${which === 'LL' ? 'right' : 'left'} rotation.${childBF === 0 ? ' A zero-balance child uses the single-rotation deletion case.' : ''}`}`)
    if (which === 'LR') rotate(ctx, child, id, 'left', 'LR · rotation 1 of 2')
    if (which === 'RL') rotate(ctx, child, id, 'right', 'RL · rotation 1 of 2')
    path[index] = rotate(ctx, id, parent, bf > 1 ? 'right' : 'left', `${which} · rotation ${which === 'LR' || which === 'RL' ? '2 of 2' : '1 of 1'}`)
  }
}
