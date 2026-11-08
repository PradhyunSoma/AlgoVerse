import { expect, test } from 'vitest'
import { createList, type NodeId } from './listModel'
import { assertDoublyList, createDoublyList, doublyNodes, toDoublyList, toSinglyList, type DoublyState } from './doublyListModel'
import { runDoublyOperation, type DoublyOperation } from './doublyListOperations'
import { createDoublyTrace, type DoublyStep } from './doublyListTrace'
import { doublyListCode } from './doublyListCode'

function assertFinal(state: DoublyState, expected: readonly number[]) {
  const forward = doublyNodes(state)
  const backward = doublyNodes(state, 'prev')
  expect(forward.map((node) => node.value)).toEqual(expected)
  expect(backward.map((node) => node.id)).toEqual(forward.map((node) => node.id).reverse())
  expect(state.head).toBe(forward[0]?.id ?? null)
  expect(state.tail).toBe(forward.at(-1)?.id ?? null)
  expect(forward[0]?.prev ?? null).toBeNull()
  expect(forward.at(-1)?.next ?? null).toBeNull()
  expect(forward).toHaveLength(Object.keys(state.nodes).length)
  expect(new Set(forward.map((node) => node.id)).size).toBe(forward.length)
  forward.forEach((node, index) => {
    expect(node.prev).toBe(forward[index - 1]?.id ?? null)
    expect(node.next).toBe(forward[index + 1]?.id ?? null)
  })
  expect(() => assertDoublyList(state)).not.toThrow()
}

function assertIntermediate(step: DoublyStep) {
  const owned = new Set([...doublyNodes(step.state), ...doublyNodes(step.state, 'prev')].map((node) => node.id))
  if (step.held) owned.add(step.held)
  expect([...owned].sort()).toEqual(Object.keys(step.state.nodes).sort())
  for (const node of Object.values(step.state.nodes)) {
    for (const field of ['next', 'prev'] as const) {
      let id: NodeId | null = node!.id
      const seen = new Set<NodeId>()
      while (id !== null) {
        expect(seen.has(id)).toBe(false)
        expect(step.state.nodes[id]).toBeDefined()
        seen.add(id)
        id = step.state.nodes[id]![field]
      }
    }
  }
  expect(step.layout).toHaveLength(Object.keys(step.state.nodes).length + (step.removed ? 1 : 0))
}

test.each([[], [0], [10, 20, 30], [-5, -5, 0, 7]].map((input) => ({ input })))('traverses $input in both directions without changing the input', ({ input }) => {
  const state = createDoublyList(input)
  const before = structuredClone(state)
  Object.values(state.nodes).forEach(Object.freeze)
  Object.freeze(state.nodes)
  Object.freeze(state)
  for (const kind of ['traverse', 'traverse-backward'] as const) {
    const trace = createDoublyTrace(state, { kind })
    expect(trace.at(-1)!.visited).toEqual(kind === 'traverse' ? input : [...input].reverse())
    expect(trace.filter((step) => step.kind === 'read').map((step) => step.visited.at(-1))).toEqual(trace.at(-1)!.visited)
    expect(trace[0].current).toBe(kind === 'traverse' ? state.head : state.tail)
    expect(trace.at(-1)!.current).toBeNull()
    expect(trace.at(-1)!.state).toEqual(before)
    trace.forEach(assertIntermediate)
  }
  expect(state).toEqual(before)
})

test('all insertion and deletion positions produce reciprocal links and stable identities', () => {
  for (let size = 0; size <= 7; size += 1) {
    const input = Array.from({ length: size }, (_, i) => i % 2 ? -5 : 10)
    const state = createDoublyList(input)
    const before = structuredClone(state)
    Object.values(state.nodes).forEach(Object.freeze)
    Object.freeze(state.nodes)
    Object.freeze(state)
    for (let position = 0; position <= size; position += 1) {
      const operation: DoublyOperation = { kind: 'insert-position', position, value: -5 }
      const trace = createDoublyTrace(state, operation)
      const expected = [...input]
      expected.splice(position, 0, -5)
      assertFinal(trace.at(-1)!.state, expected)
      trace.forEach(assertIntermediate)
      expect(trace).toEqual(createDoublyTrace(state, operation))
      const ids = doublyNodes(state).map((node) => node.id)
      ids.splice(position, 0, `n${state.nextId}`)
      expect(doublyNodes(trace.at(-1)!.state).map((node) => node.id)).toEqual(ids)
      if (position < size) {
        const deleted = createDoublyTrace(state, { kind: 'delete-position', position })
        const remaining = [...input]
        remaining.splice(position, 1)
        assertFinal(deleted.at(-1)!.state, remaining)
        deleted.forEach(assertIntermediate)
        expect(doublyNodes(deleted.at(-1)!.state).map((node) => node.id)).toEqual(doublyNodes(state).filter((_, index) => index !== position).map((node) => node.id))
      }
      expect(state).toEqual(before)
    }
  }
})

test.each([[], [0], [-5, 0, -5]].map((input) => ({ input })))('endpoint operations handle $input with no traversal', ({ input }) => {
  const cases: [DoublyOperation, number[]][] = [
    [{ kind: 'insert-start', value: -99 }, [-99, ...input]], [{ kind: 'insert-end', value: 99 }, [...input, 99]],
    [{ kind: 'delete-start' }, input.slice(1)], [{ kind: 'delete-end' }, input.slice(0, -1)],
  ]
  for (const [operation, expected] of cases) {
    const trace = createDoublyTrace(createDoublyList(input), operation)
    assertFinal(trace.at(-1)!.state, expected)
    expect(trace.some((step) => step.kind === 'visit' || step.kind === 'follow')).toBe(false)
    trace.forEach(assertIntermediate)
  }
})

test('middle insertion shows all four writes in order and does not claim both chains are updated early', () => {
  const trace = createDoublyTrace(createDoublyList([10, 20]), { kind: 'insert-position', value: 15, position: 1 })
  const writes = trace.filter((step) => step.pointer !== null)
  expect(writes.map((step) => step.pointer)).toEqual([
    { source: 'n3', field: 'prev', from: null, to: 'n1' }, { source: 'n3', field: 'next', from: null, to: 'n2' },
    { source: 'n1', field: 'next', from: 'n2', to: 'n3' }, { source: 'n2', field: 'prev', from: 'n1', to: 'n3' },
  ])
  const newNext = writes[1]
  expect(doublyNodes(newNext.state).map((node) => node.id)).toEqual(['n1', 'n2'])
  expect(doublyNodes(newNext.state, 'prev').map((node) => node.id)).toEqual(['n2', 'n1'])
  expect(newNext.held).toBe('n3')
  const half = writes[2]
  expect(doublyNodes(half.state).map((node) => node.value)).toEqual([10, 15, 20])
  expect(doublyNodes(half.state, 'prev').map((node) => node.value)).toEqual([20, 10])
  expect(half.explanation).toContain('backward connection is still pending')
  assertFinal(writes[3].state, [10, 15, 20])
})

test('middle deletion reconnects both neighbors before clearing and releasing the target', () => {
  const trace = createDoublyTrace(createDoublyList(), { kind: 'delete-position', position: 1 })
  const writes = trace.filter((step) => step.pointer !== null)
  expect(writes.map((step) => step.pointer)).toEqual([
    { source: 'n1', field: 'next', from: 'n2', to: 'n3' }, { source: 'n3', field: 'prev', from: 'n2', to: 'n1' },
    { source: 'n2', field: 'prev', from: 'n1', to: null }, { source: 'n2', field: 'next', from: 'n3', to: null },
  ])
  expect(doublyNodes(writes[0].state).map((node) => node.value)).toEqual([10, 30])
  expect(doublyNodes(writes[0].state, 'prev').map((node) => node.value)).toEqual([30, 20, 10])
  expect(writes[1].held).toBe('n2')
  expect(writes[3].state.nodes.n2).toEqual({ id: 'n2', value: 20, prev: null, next: null })
  const released = trace.find((step) => step.kind === 'remove')!
  expect(released.state.nodes.n2).toBeUndefined()
  expect(released.removed?.id).toBe('n2')
  expect(released.held).toBeNull()
  expect(trace.at(-1)!.removed).toBeNull()
})

const operations: DoublyOperation[] = [
  { kind: 'traverse' }, { kind: 'traverse-backward' }, { kind: 'insert-start', value: 0 }, { kind: 'insert-end', value: 0 },
  { kind: 'insert-position', value: 0, position: 1 }, { kind: 'delete-start' }, { kind: 'delete-end' }, { kind: 'delete-position', position: 1 },
]
test.each(operations)('$kind has deterministic independent snapshots, single pointer writes, and synchronized code', (operation) => {
  const input = createDoublyList()
  const trace = createDoublyTrace(input, operation)
  expect(trace).toEqual(createDoublyTrace(input, operation))
  const lines = doublyListCode(operation.kind)
  expect(new Set(lines.map((line) => line.id)).size).toBe(lines.length)
  trace.forEach((step, index) => {
    expect(step.lineId).toBe(step.kind)
    expect(lines.some((line) => line.id === step.lineId)).toBe(true)
    assertIntermediate(step)
    expect(step.state.nodes).not.toBe(input.nodes)
    if (index === 0) return
    const previous = trace[index - 1].state
    expect(step.state.nodes).not.toBe(previous.nodes)
    if (step.pointer) {
      const { source, field, from, to } = step.pointer
      const before = structuredClone(previous)
      // Apply exactly the announced pointer change to an independent expected snapshot.
      if (field === 'head' || field === 'tail') {
        expect(before[field]).toBe(from)
        Object.assign(before, { [field]: to })
      } else {
        expect(before.nodes[source as NodeId]![field]).toBe(from)
        Object.assign(before.nodes[source as NodeId]!, { [field]: to })
      }
      expect(step.state).toEqual(before)
    }
  })
  expect(trace.at(-1)!.kind).toBe('complete')
  expect(() => assertDoublyList(trace.at(-1)!.state)).not.toThrow()
})

test('conversion and chaining preserve IDs and never reuse a committed removed ID', () => {
  const original = createList([-1, -1, 0])
  const doubled = toDoublyList(original)
  expect(toSinglyList(doubled)).toEqual(original)
  const deleted = runDoublyOperation(doubled, { kind: 'delete-end' })
  const inserted = runDoublyOperation(deleted, { kind: 'insert-end', value: 0 })
  expect(doublyNodes(inserted).map((node) => node.id)).toEqual(['n1', 'n2', 'n4'])
  expect(inserted.nextId).toBe(5)
  assertFinal(inserted, [-1, -1, 0])
  const emptied = createDoublyList([], inserted.nextId)
  expect(runDoublyOperation(emptied, { kind: 'insert-start', value: 0 }).head).toBe('n5')
})

test.each([-1, 1.5, NaN, Infinity, 4])('rejects invalid position %s without mutation', (position) => {
  const state = createDoublyList()
  const original = structuredClone(state)
  expect(() => createDoublyTrace(state, { kind: 'insert-position', value: 2, position })).toThrow(/Position/)
  expect(() => createDoublyTrace(state, { kind: 'delete-position', position })).toThrow(/Position/)
  expect(state).toEqual(original)
})

test('validates values, limits, empty positions, reciprocal links, endpoints, and cycles', () => {
  for (const value of [NaN, Infinity, 100, -100, 1.5]) {
    expect(() => createDoublyTrace(createDoublyList(), { kind: 'insert-end', value })).toThrow()
  }
  expect(() => createDoublyTrace(createDoublyList(Array(8).fill(1)), { kind: 'insert-start', value: 1 })).toThrow(/full/)
  expect(() => createDoublyTrace(createDoublyList([]), { kind: 'delete-position', position: 0 })).toThrow(/empty/)
  const state = createDoublyList([1, 2])
  expect(() => assertDoublyList({ ...state, tail: 'n1' })).toThrow(/TAIL/)
  expect(() => assertDoublyList({ ...state, nodes: { ...state.nodes, n2: { ...state.nodes.n2!, prev: null } } })).toThrow(/reciprocal/)
  expect(() => assertDoublyList({ ...state, nodes: { ...state.nodes, n1: { ...state.nodes.n1!, prev: 'n2' } } })).toThrow(/reciprocal/)
  expect(() => assertDoublyList({ ...state, nodes: { ...state.nodes, n2: { ...state.nodes.n2!, next: 'n1' } } })).toThrow(/cycle/)
  expect(() => assertDoublyList({ ...state, nodes: { ...state.nodes, n2: { ...state.nodes.n2!, next: 'n3' } } })).toThrow(/missing/)
  expect(() => assertDoublyList({ ...state, head: null })).toThrow(/reachable/)
})
