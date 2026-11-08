import { describe, expect, test } from 'vitest'
import { assertList, createList, listNodes, listSummary, type ListState, type NodeId } from './listModel'
import { runListOperation, type ListOperation } from './listOperations'
import { createListTrace, type ListStep } from './listTrace'
import { listCode } from './listCode'

const values = (state: ListState) => listNodes(state).map((node) => node.value)
const result = (input: readonly number[], operation: ListOperation) => runListOperation(createList(input), operation)

function assertSnapshot(step: ListStep) {
  const reachable = listNodes(step.state).map((node) => node.id)
  // Detached nodes are intentional and must still have a local owner, never get lost.
  const detached = Object.keys(step.state.nodes).filter((id) => !reachable.includes(id as NodeId))
  expect(detached).toEqual(step.held && !reachable.includes(step.held) ? [step.held] : [])
  for (const node of Object.values(step.state.nodes)) {
    expect(node).toBeDefined()
    if (node!.next !== null) expect(step.state.nodes[node!.next]).toBeDefined()
    const visited = new Set<NodeId>()
    let current = node!.id as NodeId | null
    while (current !== null) {
      expect(visited.has(current)).toBe(false)
      visited.add(current)
      current = step.state.nodes[current]!.next
    }
  }
  expect(new Set(step.layout).size).toBe(step.layout.length)
  expect(step.layout).toHaveLength(Object.keys(step.state.nodes).length + (step.removed ? 1 : 0))
}

test.each([[], [0], [10, 20, 30], [-3, 2, -3]].map((input) => ({ input })))('traverses $input through next references and preserves the input', ({ input }) => {
  const state = createList(input)
  const before = structuredClone(state)
  Object.values(state.nodes).forEach(Object.freeze)
  Object.freeze(state.nodes)
  Object.freeze(state)
  const trace = createListTrace(state, { kind: 'traverse' })
  expect(trace.filter((step) => step.kind === 'read').map((step) => step.visited.at(-1))).toEqual(input)
  expect(trace.at(-1)!.visited).toEqual(input)
  expect(trace.at(-1)!.current).toBeNull()
  expect(trace.at(-1)!.state).toEqual(state)
  expect(state).toEqual(before)
  trace.forEach(assertSnapshot)
})

test('traversal follows references rather than node table insertion order or ID order', () => {
  const state: ListState = { head: 'n3', nextId: 4, nodes: {
    n1: { id: 'n1', value: 20, next: 'n2' }, n2: { id: 'n2', value: 30, next: null }, n3: { id: 'n3', value: 10, next: 'n1' },
  } }
  expect(createListTrace(state, { kind: 'traverse' }).at(-1)!.visited).toEqual([10, 20, 30])
})

test('all insertion positions and deletion positions preserve links, IDs, and inputs', () => {
  for (let length = 0; length <= 7; length += 1) {
    const input = Array.from({ length }, (_, i) => i % 2 ? -2 : 10)
    const state = createList(input)
    const original = structuredClone(state)
    for (let position = 0; position <= length; position += 1) {
      const operation: ListOperation = { kind: 'insert-position', value: -2, position }
      const trace = createListTrace(state, operation)
      const final = trace.at(-1)!.state
      const expected = [...input]
      expected.splice(position, 0, -2)
      expect(values(final)).toEqual(expected)
      expect(listNodes(final).map((node) => node.id)).toEqual([
        ...listNodes(state).slice(0, position).map((node) => node.id), `n${state.nextId}`,
        ...listNodes(state).slice(position).map((node) => node.id),
      ])
      trace.forEach(assertSnapshot)
      expect(() => assertList(final)).not.toThrow()
      expect(trace).toEqual(createListTrace(state, operation))
      if (position < length) {
        const deletion = createListTrace(state, { kind: 'delete-position', position })
        const expectedDeleted = [...input]
        expectedDeleted.splice(position, 1)
        expect(values(deletion.at(-1)!.state)).toEqual(expectedDeleted)
        expect(listNodes(deletion.at(-1)!.state).map((node) => node.id)).toEqual(listNodes(state).filter((_, i) => i !== position).map((node) => node.id))
        deletion.forEach(assertSnapshot)
        expect(() => assertList(deletion.at(-1)!.state)).not.toThrow()
      }
      expect(state).toEqual(original)
    }
  }
})

test.each([[], [0], [10, -20, 10]].map((input) => ({ input })))('beginning and end operations handle $input', ({ input }) => {
  expect(values(result(input, { kind: 'insert-start', value: -99 }))).toEqual([-99, ...input])
  expect(values(result(input, { kind: 'insert-end', value: 99 }))).toEqual([...input, 99])
  expect(values(result(input, { kind: 'delete-start' }))).toEqual(input.slice(1))
  expect(values(result(input, { kind: 'delete-end' }))).toEqual(input.slice(0, -1))
})

test('insertion connects the successor first, then updates HEAD or predecessor', () => {
  for (const position of [0, 1, 3]) {
    const state = createList()
    const trace = createListTrace(state, { kind: 'insert-position', value: 15, position })
    const allocated = trace.find((step) => step.kind === 'allocate')!
    expect(allocated.dataAssigned).toBe(false)
    expect(allocated.state.nodes.n4!.next).toBeNull()
    expect(allocated.held).toBe('n4')
    const linked = trace.find((step) => step.kind === 'link-new')!
    expect(linked.state.nodes.n4).toEqual({ id: 'n4', value: 15, next: listNodes(state)[position]?.id ?? null })
    expect(values(linked.state)).toEqual([10, 20, 30])
    expect(linked.state.head).toBe('n1')
    const connected = trace.find((step) => step.kind === (position === 0 ? 'link-head' : 'link-previous'))!
    expect(values(connected.state)).toHaveLength(4)
    expect(connected.pointer).toEqual({ source: position === 0 ? 'HEAD' : `n${position}`, from: listNodes(state)[position]?.id ?? null, to: 'n4' })
    expect(trace.indexOf(linked)).toBeLessThan(trace.indexOf(connected))
  }
})

test('deletion keeps the target locally while bypassing, then releases it', () => {
  for (let position = 0; position < 3; position += 1) {
    const trace = createListTrace(createList(), { kind: 'delete-position', position })
    const target = `n${position + 1}` as NodeId
    const detached = trace.find((step) => step.kind.startsWith('bypass'))!
    expect(detached.held).toBe(target)
    expect(detached.state.nodes[target]).toBeDefined()
    expect(listNodes(detached.state).some((node) => node.id === target)).toBe(false)
    const removed = trace.find((step) => step.kind === 'remove')!
    expect(removed.state.nodes[target]).toBeUndefined()
    expect(removed.removed?.id).toBe(target)
    expect(removed.held).toBeNull()
    expect(trace.at(-1)!.removed).toBeNull()
    expect(trace.at(-1)!.layout).not.toContain(target)
  }
})

test('IDs are not reused after deletion, clearing, or creating a new example', () => {
  const inserted = result([10], { kind: 'insert-start', value: 10 })
  const deleted = runListOperation(inserted, { kind: 'delete-start' })
  const next = runListOperation(deleted, { kind: 'insert-end', value: 10 })
  expect(listNodes(next).map((node) => node.id)).toEqual(['n1', 'n3'])
  const empty = createList([], next.nextId)
  expect(result([], { kind: 'insert-start', value: 1 }).head).toBe('n1')
  expect(runListOperation(empty, { kind: 'insert-start', value: 1 }).head).toBe('n4')
  expect(createList([10, 20, 30], next.nextId).head).toBe('n4')
})

describe('validation preserves the supplied state', () => {
  test.each([-1, 1.5, NaN, Infinity, 4])('rejects invalid position %s', (position) => {
    const state = createList()
    const before = structuredClone(state)
    expect(() => createListTrace(state, { kind: 'insert-position', value: 5, position })).toThrow(/Position/)
    expect(() => createListTrace(state, { kind: 'delete-position', position })).toThrow(/Position/)
    expect(state).toEqual(before)
  })
  test('allows insertion at length but rejects deletion at length or any empty-list position', () => {
    expect(() => result([1], { kind: 'insert-position', position: 1, value: 2 })).not.toThrow()
    expect(() => result([1], { kind: 'delete-position', position: 1 })).toThrow()
    expect(() => result([], { kind: 'delete-position', position: 0 })).toThrow(/empty/)
  })
  test.each([100, -100, NaN, Infinity, 1.5])('rejects invalid value %s', (value) => {
    expect(() => createList([value])).toThrow()
    expect(() => result([], { kind: 'insert-start', value })).toThrow()
  })
  test('enforces the size limit and rejects corrupt references, unreachable nodes, and cycles', () => {
    expect(() => createList(Array(9).fill(1))).toThrow(/8/)
    expect(() => result(Array(8).fill(1), { kind: 'insert-end', value: 1 })).toThrow(/full/)
    const state = createList([1])
    expect(() => assertList({ ...state, nodes: { n1: { id: 'n1', value: 1, next: 'n1' } } })).toThrow(/cycle/)
    expect(() => assertList({ ...state, nodes: { n1: { id: 'n1', value: 1, next: 'n2' } } })).toThrow(/missing/)
    expect(() => assertList({ ...state, head: null })).toThrow(/reachable/)
    expect(() => assertList({ ...state, nextId: 1 })).toThrow(/identity/)
  })
})

test('every operation has matching stable pseudocode IDs and isolated snapshots', () => {
  const operations: ListOperation[] = [
    { kind: 'traverse' }, { kind: 'insert-start', value: 5 }, { kind: 'insert-end', value: 5 },
    { kind: 'insert-position', value: 5, position: 1 }, { kind: 'delete-start' }, { kind: 'delete-end' }, { kind: 'delete-position', position: 1 },
  ]
  for (const operation of operations) {
    const input = createList()
    const trace = createListTrace(input, operation)
    const ids = listCode(operation.kind).map((line) => line.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const step of trace) {
      expect(ids).toContain(step.lineId)
      expect(step.lineId).toBe(step.kind)
      assertSnapshot(step)
    }
    expect(trace.at(-1)!.kind).toBe('complete')
    expect(trace[0].state.nodes.n1).not.toBe(trace[1].state.nodes.n1)
    expect(trace[0].state.nodes.n1).not.toBe(input.nodes.n1)
    expect(listSummary(input)).toBe('10 → 20 → 30 → NULL')
  }
})
