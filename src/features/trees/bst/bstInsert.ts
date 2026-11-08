import { BSTContext } from './bstContext'
import { locateBST } from './bstSearch'
export function insertBST(ctx: BSTContext, value: number) {
  const { id, parent, side } = locateBST(ctx, value)
  if (id !== null) throw new RangeError(`${value} already exists. Duplicate insertions are not allowed.`)
  ctx.emit('slot', `Found an empty ${parent === null ? 'ROOT' : `${side} child of ${ctx.label(parent)}`} slot for ${value}.`)
  const created = ctx.allocate(value)
  ctx.newId = created
  ctx.locals.newNode = created
  ctx.current = created
  ctx.emit('allocate', `Create ${created} with value ${value} and NULL children. It is held locally by newNode and is not connected to ROOT yet.`)
  ctx.write(parent ?? 'ROOT', parent === null ? 'root' : side, created, 'connect', `Connect ${parent === null ? 'ROOT' : `${parent}.${side}`} to ${created}.`)
  ctx.result = created
  ctx.outcome = 'inserted'
}
