import { describe, expect, test } from 'vitest'
import { parseGraph, sampleGraph } from './graphInput'
import { buildAdjacency } from './graphAdjacency'
import { breadthFirstSearch } from './bfs'
import { createBFSTrace } from './bfsTrace'
import { bfsCode } from './bfsCode'
import { validateGraph, type Graph, type VertexId } from './graphModel'
import { edgePath, layoutGraph } from './graphLayout'

const names = (graph: Graph, ids: readonly VertexId[]) => ids.map(id => graph.vertices.find(v => v.id === id)!.label)
const final = (graph: Graph, start: VertexId | null = graph.vertices[0]?.id ?? null) => createBFSTrace(graph, start).at(-1)!

test.each([
  ['', '', false, []], ['A', '', false, ['A']], ['A,B,C', 'A-B\nB-C', false, ['A', 'B', 'C']],
  ['A,B,C,D', 'A-B\nC-D', false, ['A', 'B']], ['A,B,C', '', false, ['A']],
  ['A,B,C', 'A-B\nB-C\nC-A', false, ['A', 'B', 'C']],
  ['A,B,C', 'B-A\nB-C', true, ['A']], ['A,B,C', 'A-B\nB-C\nC-A', true, ['A', 'B', 'C']],
] as const)('handles graph %s / %s directed=%s', (vertices, edges, directed, expected) => {
  const graph = parseGraph(vertices, edges, directed), step = final(graph)
  expect(names(graph, step.order)).toEqual(expected)
  expect(step.processed).toEqual(step.order)
  expect(step.queue).toEqual([])
  expect(step.unreachable).toEqual(graph.vertices.filter(v => !step.order.includes(v.id)).map(v => v.id))
})

test('sample order, parents, distances, FIFO transitions, and no repeated enqueue', () => {
  const graph = sampleGraph(), trace = createBFSTrace(graph, 'v1'), last = trace.at(-1)!
  expect(names(graph, last.order)).toEqual(['A', 'B', 'C', 'D', 'E', 'F'])
  expect(last.distances).toEqual({ v1: 0, v2: 1, v3: 1, v4: 2, v5: 2, v6: 2 })
  expect(last.parents).toEqual({ v1: null, v2: 'v1', v3: 'v1', v4: 'v2', v5: 'v2', v6: 'v3' })
  expect(trace.filter(s => s.kind === 'processed').map(s => names(graph, s.queue))).toEqual([['B', 'C'], ['C', 'D', 'E'], ['D', 'E', 'F'], ['E', 'F'], ['F'], []])
  const enqueued: VertexId[] = []
  trace.forEach((step, index) => {
    const previous = trace[index - 1]
    expect(new Set(step.queue).size).toBe(step.queue.length)
    expect(step.queue.every(id => step.discovered.includes(id))).toBe(true)
    expect(new Set(step.order).size).toBe(step.order.length)
    expect(step.processed.every(id => step.order.includes(id))).toBe(true)
    expect(bfsCode.some(line => line.id === step.lineId)).toBe(true)
    if (step.kind === 'start-enqueue' || step.kind === 'enqueue') {
      const id = step.queue.at(-1)!
      expect(previous.discovered).toContain(id)
      expect(enqueued).not.toContain(id); enqueued.push(id)
      expect(step.queue).toEqual([...previous.queue, id])
    } else if (step.kind === 'dequeue') {
      expect(step.active).toBe(previous.queue[0])
      expect(step.queue).toEqual(previous.queue.slice(1))
      expect(step.order).toEqual(previous.order)
    } else if (previous) expect(step.queue).toEqual(previous.queue)
    if (step.kind === 'record') {
      expect(step.parents[step.neighbor!]).toBe(step.active)
      expect(step.distances[step.neighbor!]).toBe(step.distances[step.active!]! + 1)
      expect(step.treeEdges).toContain(step.inspectedEdge)
    }
    if (step.kind === 'skip') {
      expect(step.parents).toEqual(previous.parents)
      expect(step.distances).toEqual(previous.distances)
    }
    if (step.kind !== 'complete') expect(step.unreachable).toEqual([])
  })
  expect(enqueued).toEqual(last.order)
})

test('neighbor iteration ignores edge input order and uses alphabetical labels', () => {
  const graph = parseGraph('C,A,D,B', 'A-D\nA-C\nA-B', true)
  const a = graph.vertices.find(v => v.label === 'A')!.id
  expect(names(graph, buildAdjacency(graph).get(a)!.map(n => n.vertex))).toEqual(['B', 'C', 'D'])
  expect(names(graph, final(graph, a).order)).toEqual(['A', 'B', 'C', 'D'])
})

test('traces preserve input, stable identities, independent snapshots, and are deeply frozen', () => {
  const graph = sampleGraph(), original = structuredClone(graph), trace = createBFSTrace(graph, 'v1')
  expect(createBFSTrace(graph, 'v1')).toEqual(trace)
  expect(graph).toEqual(original)
  for (const step of trace) {
    expect(step.graph).toEqual(original)
    expect(Object.isFrozen(step)).toBe(true)
    for (const field of ['queue', 'order', 'discovered', 'processed', 'parents', 'distances', 'treeEdges', 'unreachable', 'graph'] as const) expect(Object.isFrozen(step[field])).toBe(true)
    expect(step.graph.vertices.every(Object.isFrozen)).toBe(true)
    expect(step.graph.edges.every(Object.isFrozen)).toBe(true)
  }
  expect(trace[0].order).toEqual([])
  expect(trace[0].parents).toEqual({})
  expect(trace[0].queue).not.toBe(trace.at(-1)!.queue)
  expect(Object.isFrozen(trace)).toBe(true)
})

test.each([
  ['A,A', '', /unique/], ['A,', '', /Empty labels/], ['1,A', '', /beginning/], ['ABCDE', '', /1–4/],
  ['A,B', 'A->B', /Invalid edge/], ['A,B', 'A-C', /Unknown vertex/], ['A', 'A-A', /Self-loops/],
  ['A,B', 'A-B\nA-B', /Duplicate/], ['A,B', 'A-B\nB-A', /Duplicate/],
  ['A,B,C,D,E,F,G,H,I,J,K', '', /10 vertices/],
] as const)('rejects malformed input %s %s', (vertices, edges, message) => {
  expect(() => parseGraph(vertices, edges, false)).toThrow(message)
})

test('supports reciprocal directed edges and rejects invalid graph references, counters, IDs, source', () => {
  const graph = parseGraph('a,b', 'a-b\nb-a', true)
  expect(graph.vertices.map(v => v.label)).toEqual(['A', 'B'])
  expect(graph.edges).toHaveLength(2)
  expect(() => validateGraph({ ...graph, edges: [{ ...graph.edges[0], destination: 'v99' }] })).toThrow(/existing/)
  expect(() => validateGraph({ ...graph, vertices: [graph.vertices[0], graph.vertices[0]] })).toThrow(/IDs/)
  expect(() => validateGraph({ ...graph, edges: [graph.edges[0], graph.edges[0]] })).toThrow(/IDs/)
  expect(() => validateGraph({ ...graph, nextVertexId: 1 })).toThrow(/counters/)
  expect(() => createBFSTrace(graph, null)).toThrow(/starting vertex/)
  expect(() => createBFSTrace(graph, 'v99')).toThrow(/starting vertex/)
  expect(() => createBFSTrace(parseGraph('', '', false), 'v1')).toThrow(/starting vertex/)
  expect(() => parseGraph('A,B', Array(21).fill('A-B').join('\n'), true)).toThrow(/20 edges/)
})

test('graph edits retain vertex/edge IDs, remove stale references, and never reuse removed IDs', () => {
  const original = sampleGraph(), copy = structuredClone(original)
  const changed = parseGraph('A,B,C,Z', 'B-A\nA-C\nC-Z', false, original)
  expect(changed.vertices.slice(0, 3)).toEqual(original.vertices.slice(0, 3))
  expect(changed.vertices[3].id).toBe('v7')
  expect(changed.edges.map(e => e.id)).toEqual(['e1', 'e2', 'e7'])
  const back = parseGraph('A,B,C,D', 'A-B\nA-C', false, changed)
  expect(back.vertices[3].id).toBe('v8')
  expect(original).toEqual(copy)
  expect(() => parseGraph('A,B', 'A-B\nB-A', false, original)).toThrow(/Duplicate edges/)
  expect(() => parseGraph('A', 'A-B', false, original)).toThrow(/Unknown/)
  const empty = parseGraph('', '', false, original)
  expect(parseGraph('A', '', false, empty).vertices[0].id).toBe('v7')
})

test('direction conversion follows the draft explicitly and rejects duplicate collapsed connections', () => {
  const graph = parseGraph('A,B', 'A-B\nB-A', true)
  expect(() => parseGraph('A,B', 'A-B\nB-A', false, graph)).toThrow()
  const single = parseGraph('A,B', 'A-B', false, graph)
  expect(single.edges[0].id).toBe(graph.edges[0].id)
  expect(final(single, 'v2').order).toEqual(['v2', 'v1'])
  const directed = parseGraph('A,B', 'B-A', true, single)
  expect(final(directed, 'v1').order).toEqual(['v1'])
})

test('distances match an independent all-pairs shortest-distance oracle on bounded cyclic graphs', () => {
  for (const directed of [true, false]) for (let mask = 0; mask < 64; mask++) {
    const labels = ['A', 'B', 'C', 'D'], pairs = directed ? [[0,1],[1,0],[1,2],[2,3],[3,0],[0,2]] : [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]]
    const selected = pairs.filter((_, i) => mask & (1 << i))
    const graph = parseGraph(labels.join(','), selected.map(([a,b]) => `${labels[a]}-${labels[b]}`).join('\n'), directed)
    const distances = labels.map((_, i) => labels.map((_, j) => i === j ? 0 : Infinity))
    for (const [a,b] of selected) { distances[a][b] = 1; if (!directed) distances[b][a] = 1 }
    for (let k=0;k<4;k++) for (let i=0;i<4;i++) for (let j=0;j<4;j++) distances[i][j] = Math.min(distances[i][j], distances[i][k]+distances[k][j])
    for (let i=0;i<4;i++) {
      const result = breadthFirstSearch(graph, graph.vertices[i].id)
      for (let j=0;j<4;j++) expect(result.distances[graph.vertices[j].id] ?? Infinity).toBe(distances[i][j])
      expect(new Set(result.order).size).toBe(result.order.length)
      for (const [child, parent] of Object.entries(result.parents)) if (parent) expect(result.distances[child as VertexId]).toBe(result.distances[parent]!+1)
    }
  }
})

describe('layout', () => {
  test('stable positions, separated supported vertices, and distinct reciprocal lanes', () => {
    for (let n = 1; n <= 10; n++) {
      const graph = parseGraph('ABCDEFGHIJ'.slice(0,n).split('').join(','), '', false), layout = layoutGraph(graph)
      for (const a of layout.values()) for (const b of layout.values()) if (a !== b) expect(Math.hypot(a.x-b.x,a.y-b.y)).toBeGreaterThan(95)
      for (const step of createBFSTrace(graph, graph.vertices[0].id)) expect(layoutGraph(step.graph)).toEqual(layout)
    }
    const a={x:100,y:100}, b={x:300,y:100}
    expect(edgePath(a,b,true)).not.toBe(edgePath(a,b,false))
    expect(edgePath(a,b,true)).not.toBe(edgePath(b,a,true))
  })
})
