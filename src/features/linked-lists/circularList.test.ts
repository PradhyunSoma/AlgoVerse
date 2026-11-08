import { describe, expect, test } from 'vitest'
import { assertCircularList, circularToSingly, circularWalk, createCircularList, toCircularList, type CircularState } from './circularListModel'
import { createCircularTrace } from './circularListTrace'
import { circularListCode } from './circularListCode'
import { runCircularOperation } from './circularListOperations'
import { createList, listNodes, type NodeId } from './listModel'
import type { ListOperation } from './listOperations'

/** Independent oracle: do not rely on the production walker or validator. */
function verifyCircle(state: CircularState, expected: readonly number[]) {
  const ids: NodeId[] = []
  const values: number[] = []
  let cursor = state.head
  for (let count = 0; count < expected.length; count += 1) {
    expect(cursor).not.toBeNull()
    expect(ids).not.toContain(cursor)
    const node = state.nodes[cursor!]!
    expect(node).toBeDefined()
    expect(node.id).toBe(cursor)
    ids.push(node.id)
    values.push(node.value)
    cursor = node.next
  }
  expect(values).toEqual(expected)
  expect(cursor).toBe(state.head)
  expect(state.tail).toBe(ids.at(-1) ?? null)
  expect(Object.keys(state.nodes).sort()).toEqual([...ids].sort())
  if (ids.length) expect(state.nodes[state.tail!]!.next).toBe(state.head)
  else { expect(state.head).toBeNull(); expect(state.tail).toBeNull() }
  return ids
}
function freeze(state: CircularState) {
  Object.values(state.nodes).forEach(Object.freeze)
  Object.freeze(state.nodes)
  return Object.freeze(state)
}

test.each([[], [10], [-5, -5, 2], [10, 20, 30]].map((values) => ({ values })))('creates and traverses one complete circle: $values', ({ values }) => {
  const state = createCircularList(values)
  verifyCircle(state, values)
  if (values.length === 1) expect(state.nodes[state.head!]!.next).toBe(state.head)
  const trace = createCircularTrace(freeze(state), { kind: 'traverse' })
  expect(trace.at(-1)!.visited).toEqual(values)
  expect(trace.filter((step) => step.kind === 'read')).toHaveLength(values.length)
  expect(trace.filter((step) => step.kind === 'visit').map((step) => step.current)).toEqual(Object.keys(state.nodes))
  expect(trace.filter((step) => step.kind === 'follow').at(-1)?.current ?? null).toBe(state.head)
  verifyCircle(trace.at(-1)!.state, values)
})

describe('all insertion and deletion positions, including both endpoints', () => {
  for (let size = 0; size <= 7; size += 1) {
    test(`every valid mutation on ${size} nodes preserves the exact intended cycle`, () => {
      const values: number[] = Array.from({ length: size }, (_, index) => index % 2 ? -5 : 10)
      const input = freeze(createCircularList(values))
      const before = JSON.stringify(input)
      const operations: ListOperation[] = [
        { kind: 'insert-start', value: -5 }, { kind: 'insert-end', value: -5 },
        { kind: 'delete-start' }, { kind: 'delete-end' },
        ...Array.from({ length: size + 1 }, (_, position): ListOperation => ({ kind: 'insert-position', position, value: -5 })),
        ...Array.from({ length: size }, (_, position): ListOperation => ({ kind: 'delete-position', position })),
      ]
      for (const op of operations) {
        const expected = [...values]
        const position = 'position' in op ? op.position : op.kind.endsWith('start') ? 0 : 'value' in op ? size : size - 1
        if ('value' in op) expected.splice(position, 0, op.value)
        else if (size) expected.splice(position, 1)
        const trace = createCircularTrace(input, op)
        const final = trace.at(-1)!.state
        const finalIds = verifyCircle(final, expected)
        expect(JSON.stringify(input)).toBe(before)
        expect(trace).toEqual(createCircularTrace(input, op))
        expect(runCircularOperation(input, op)).toEqual(final)
        for (const id of finalIds) if (input.nodes[id]) expect(final.nodes[id]!.value).toBe(input.nodes[id]!.value)
        const originalIds = Object.keys(input.nodes)
        if ('value' in op) expect(finalIds.filter((id) => originalIds.includes(id))).toEqual(originalIds)
        else expect(finalIds).toEqual(originalIds.filter((_, index) => index !== position))
        const code = circularListCode(op.kind).map((line) => line.id)
        for (const step of trace) {
          expect(code).toContain(step.lineId)
          for (const node of Object.values(step.state.nodes)) {
            if (node!.next !== null) expect(step.state.nodes[node!.next]).toBeDefined()
          }
          for (const endpoint of [step.state.head, step.state.tail, step.held]) if (endpoint !== null) expect(step.state.nodes[endpoint]).toBeDefined()
          circularWalk(step.state) // Must terminate even during temporary endpoint updates.
        }
        for (let i = 1; i < trace.length; i += 1) {
          const step = trace[i]
          expect(step.state).not.toBe(trace[i - 1].state)
          expect(step.state.nodes).not.toBe(trace[i - 1].state.nodes)
          if (!step.pointer) continue
          const beforeState = trace[i - 1].state
          const { source, from, to } = step.pointer
          const read = (state: CircularState) => source === 'HEAD' ? state.head : source === 'TAIL' ? state.tail : state.nodes[source]!.next
          expect(read(beforeState)).toBe(from)
          expect(read(step.state)).toBe(to)
          const reconstructed = structuredClone(beforeState)
          const patched = source === 'HEAD' ? { ...reconstructed, head: to } : source === 'TAIL' ? { ...reconstructed, tail: to }
            : { ...reconstructed, nodes: { ...reconstructed.nodes, [source]: { ...reconstructed.nodes[source]!, next: to } } }
          expect(step.state).toEqual(patched)
        }
      }
    })
  }
})

test('middle insertion connects successor first; deletion bypasses before detaching and releasing', () => {
  const input = createCircularList()
  const insert = createCircularTrace(input, { kind: 'insert-position', position: 1, value: 15 })
  expect(insert.filter((step) => step.pointer).map((step) => step.pointer)).toEqual([
    { source: 'n4', from: null, to: 'n2' }, { source: 'n1', from: 'n2', to: 'n4' },
  ])
  const linked = insert.find((step) => step.kind === 'new-next')!
  expect(circularWalk(linked.state).nodes.map((node) => node.id)).not.toContain('n4')
  expect(linked.held).toBe('n4')
  const deletion = createCircularTrace(insert.at(-1)!.state, { kind: 'delete-position', position: 1 })
  expect(deletion.filter((step) => step.pointer).map((step) => step.pointer)).toEqual([
    { source: 'n1', from: 'n4', to: 'n2' }, { source: 'n4', from: 'n2', to: null },
  ])
  const bypass = deletion.find((step) => step.kind === 'bypass')!
  expect(circularWalk(bypass.state).nodes.map((node) => node.id)).not.toContain('n4')
  expect(bypass.held).toBe('n4')
  expect(deletion.find((step) => step.kind === 'remove')!.state.nodes.n4).toBeUndefined()
})

test('head/tail updates retain the closing reference; endpoint complexity matches actual pointer operations', () => {
  const state = createCircularList([1, 2, 3, 4])
  for (const operation of [{ kind: 'insert-start', value: 9 }, { kind: 'insert-end', value: 9 }, { kind: 'delete-start' }] as const) {
    const trace = createCircularTrace(state, operation)
    expect(trace.some((step) => step.kind === 'visit' || step.kind === 'follow')).toBe(false)
    expect(trace.at(-1)!.state.nodes[trace.at(-1)!.state.tail!]!.next).toBe(trace.at(-1)!.state.head)
  }
  expect(createCircularTrace(state, { kind: 'delete-end' }).filter((step) => step.kind === 'follow')).toHaveLength(3)
})

test('invalid input and malformed circles are rejected without mutation', () => {
  const state = freeze(createCircularList())
  for (const position of [-1, 1.2, 4, NaN]) {
    expect(() => createCircularTrace(state, { kind: 'insert-position', position, value: 1 })).toThrow()
    expect(() => createCircularTrace(state, { kind: 'delete-position', position })).toThrow()
  }
  expect(() => createCircularTrace(state, { kind: 'delete-position', position: 3 })).toThrow()
  expect(() => createCircularTrace(createCircularList([]), { kind: 'delete-position', position: 0 })).toThrow(/empty/)
  for (const value of [-100, 100, 1.2, Infinity]) expect(() => createCircularTrace(state, { kind: 'insert-end', value })).toThrow()
  expect(() => createCircularTrace(createCircularList(Array(8).fill(1)), { kind: 'insert-start', value: 0 })).toThrow(/full/)
  for (const bad of [
    { ...state, tail: 'n2' as const }, { ...state, head: null },
    { ...state, nodes: { ...state.nodes, n3: { ...state.nodes.n3!, next: null } } },
    { ...state, nodes: { ...state.nodes, n3: { ...state.nodes.n3!, next: 'n2' as const } } },
    { ...state, nodes: { ...state.nodes, n4: { id: 'n4' as const, value: 4, next: 'n4' as const } }, nextId: 5 },
  ]) expect(() => assertCircularList(bad)).toThrow()
})

test('conversions preserve values, IDs, and allocation counter without mutating the input', () => {
  const linear = createList([-9, -9, 3], 12)
  const circular = toCircularList(linear)
  verifyCircle(circular, [-9, -9, 3])
  expect(circular.nextId).toBe(linear.nextId)
  expect(circularToSingly(freeze(circular))).toEqual(linear)
  expect(listNodes(linear).at(-1)!.next).toBeNull()
})
