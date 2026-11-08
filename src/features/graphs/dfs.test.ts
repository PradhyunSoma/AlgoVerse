import { expect, test } from 'vitest'
import { parseGraph, sampleGraph } from './graphInput'
import { depthFirstSearch } from './dfs'
import { createDFSTrace } from './dfsTrace'
import { createBFSTrace } from './bfsTrace'
import { dfsCode } from './dfsCode'
import { layoutGraph } from './graphLayout'
import type { Graph, VertexId } from './graphModel'

const names = (graph: Graph, ids: readonly VertexId[]) => ids.map(id => graph.vertices.find(v => v.id === id)!.label)
test.each([
  ['', '', false, []], ['A', '', false, ['A']], ['A,B,C', 'A-B\nB-C', false, ['A','B','C']],
  ['A,B,C,D', 'A-B\nC-D', false, ['A','B']], ['A,B,C', '', false, ['A']],
  ['A,B,C', 'A-B\nB-C\nC-A', false, ['A','B','C']],
  ['A,B,C', 'B-A\nB-C', true, ['A']], ['A,B,C', 'A-B\nB-C\nC-A', true, ['A','B','C']],
] as const)('DFS handles %s / %s directed=%s', (vertices, edges, directed, expected) => {
  const graph = parseGraph(vertices, edges, directed), last = createDFSTrace(graph, graph.vertices[0]?.id ?? null).at(-1)!
  expect(names(graph, last.order)).toEqual(expected)
  expect(new Set(last.processed)).toEqual(new Set(last.order))
  expect(last.stack).toEqual([])
  expect(last.active).toBeNull()
  expect(last.unreachable).toEqual(graph.vertices.filter(v => !last.order.includes(v.id)).map(v => v.id))
})

test('sample discovery, completion, parents, DFS tree, depth, and backtracking are exact', () => {
  const graph = sampleGraph(), trace = createDFSTrace(graph, 'v1'), last = trace.at(-1)!
  expect(names(graph, last.order)).toEqual(['A','B','D','E','F','C'])
  expect(names(graph, last.processed)).toEqual(['D','C','F','E','B','A'])
  expect(last.parents).toEqual({v1:null,v2:'v1',v4:'v2',v5:'v2',v6:'v5',v3:'v6'})
  expect(last.treeEdges).toEqual(['e1','e3','e4','e6','e5'])
  expect(Math.max(...trace.map(s => s.stack.length))).toBe(5)
  expect(trace.filter(s => s.kind === 'backtrack').map(s => names(graph, [s.returned!.vertex, s.active!]))).toEqual([['D','B'],['C','F'],['F','E'],['E','B'],['B','A']])
  const dReturn = trace.findIndex(s => s.kind === 'return' && s.active === 'v4')
  expect(trace[dReturn].stack.map(f => f.vertex)).toEqual(['v1','v2','v4'])
  expect(trace[dReturn].processed).not.toContain('v4')
  expect(trace[dReturn+1].kind).toBe('finish')
  expect(trace[dReturn+1].stack.map(f => f.vertex)).toEqual(['v1','v2'])
  expect(trace[dReturn+1].processed).toEqual(['v4'])
  expect(trace[dReturn+2].kind).toBe('backtrack')
  expect(trace[dReturn+3].neighbor).toBe('v5')
  expect(names(graph, createBFSTrace(graph,'v1').at(-1)!.order)).toEqual(['A','B','C','D','E','F'])
})

test('every snapshot matches call entry, discovery, visit, edge inspection, actual return, and pseudocode', () => {
  const graph = sampleGraph(), trace = createDFSTrace(graph,'v1')
  expect(new Set(dfsCode.map(line => line.id)).size).toBe(dfsCode.length)
  for (const [i, step] of trace.entries()) {
    const previous = trace[i-1], ids = step.stack.map(f => f.vertex)
    expect(dfsCode.some(line => line.id === step.lineId)).toBe(true)
    expect(step.lineId).toBe(step.kind)
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(step.order).size).toBe(step.order.length)
    expect(step.active).toBe(ids.at(-1) ?? null)
    expect(step.processed.every(id => !ids.includes(id))).toBe(true)
    expect(step.order.every(id => step.discovered.includes(id))).toBe(true)
    expect(step.discovered.filter(id => !step.processed.includes(id))).toEqual(ids.filter(id => step.discovered.includes(id)))
    for (const [j, frame] of step.stack.entries()) {
      expect(frame.parent).toBe(ids[j-1] ?? null)
      if (frame.via) {
        const edge = graph.edges.find(e => e.id === frame.via)!
        expect([edge.source,edge.destination]).toContain(frame.vertex)
        expect([edge.source,edge.destination]).toContain(frame.parent)
      }
    }
    if (step.kind === 'enter') {
      expect(['start-call','recurse']).toContain(previous.kind)
      expect(ids).toEqual([...previous.stack.map(f => f.vertex), step.active])
      expect(step.discovered).not.toContain(step.active)
      expect(trace[i+1].kind).toBe('discover')
    } else if (step.kind === 'finish') {
      expect(previous.kind).toBe('return')
      expect(ids).toEqual(previous.stack.slice(0,-1).map(f => f.vertex))
      expect(step.returned!.vertex).toBe(previous.active)
      expect(step.processed).toEqual([...previous.processed, previous.active])
    } else if (previous) expect(step.stack).toEqual(previous.stack)
    if (step.kind === 'discover') expect(step.discovered).toEqual([...previous.discovered,step.active])
    else if (previous) expect(step.discovered).toEqual(previous.discovered)
    if (step.kind === 'visit') expect(step.order).toEqual([...previous.order,step.active])
    else if (previous) expect(step.order).toEqual(previous.order)
    if (step.kind === 'skip') expect(step.discovered).toContain(step.neighbor)
    if (step.kind === 'inspect') {
      const edge = graph.edges.find(e => e.id === step.inspectedEdge)!
      expect([edge.source,edge.destination]).toContain(step.active)
      expect([edge.source,edge.destination]).toContain(step.neighbor)
    }
    if (step.kind !== 'complete') expect(step.unreachable).toEqual([])
  }
})

test('input is untouched, all snapshots are frozen, identities and positions stay stable', () => {
  const graph = sampleGraph(), before = structuredClone(graph), trace = createDFSTrace(graph,'v1')
  expect(createDFSTrace(graph,'v1')).toEqual(trace)
  expect(depthFirstSearch(graph,'v1').order).toEqual(trace.at(-1)!.order)
  expect(graph).toEqual(before)
  expect(Object.isFrozen(trace)).toBe(true)
  for (const step of trace) {
    expect(step.graph).toEqual(before)
    expect(layoutGraph(step.graph)).toEqual(layoutGraph(graph))
    expect(Object.isFrozen(step)).toBe(true)
    for (const field of ['discovered','order','processed','parents','stack','treeEdges','unreachable','graph'] as const) expect(Object.isFrozen(step[field])).toBe(true)
    expect(step.stack.every(Object.isFrozen)).toBe(true)
    expect(step.graph.vertices.every(Object.isFrozen)).toBe(true)
    expect(step.graph.edges.every(Object.isFrozen)).toBe(true)
    if (step.returned) expect(Object.isFrozen(step.returned)).toBe(true)
  }
  expect(trace[0].parents).toEqual({})
  expect(trace[0].order).toEqual([])
})

test('order is alphabetical regardless of input order, and returning does not require a reverse directed edge', () => {
  const graph = parseGraph('D,C,A,B','A-C\nA-B\nB-D',true), start = graph.vertices.find(v => v.label==='A')!.id
  const trace = createDFSTrace(graph,start)
  expect(names(graph,trace.at(-1)!.order)).toEqual(['A','B','D','C'])
  for (const step of trace.filter(s => s.kind==='inspect')) {
    const edge = graph.edges.find(e => e.id === step.inspectedEdge)!
    expect(edge.source).toBe(step.active); expect(edge.destination).toBe(step.neighbor)
  }
  expect(trace.filter(s => s.kind==='backtrack')).toHaveLength(3)
})

test('chain depth reaches V and completion reverses the chain', () => {
  const graph = parseGraph('A,B,C,D,E,F,G,H,I,J','A-B\nB-C\nC-D\nD-E\nE-F\nF-G\nG-H\nH-I\nI-J',true)
  const trace = createDFSTrace(graph,'v1')
  expect(Math.max(...trace.map(s=>s.stack.length))).toBe(10)
  expect(trace.at(-1)!.processed).toEqual([...trace.at(-1)!.order].reverse())
})

test('validates the starting vertex and graph before emitting any events', () => {
  const graph = sampleGraph(), events: unknown[]=[]
  expect(()=>depthFirstSearch(graph,'v99',e=>events.push(e))).toThrow(/starting vertex/)
  expect(()=>depthFirstSearch(graph,null,e=>events.push(e))).toThrow(/starting vertex/)
  expect(()=>createDFSTrace(parseGraph('','',false),'v1')).toThrow(/starting vertex/)
  expect(()=>depthFirstSearch({...graph,edges:[{...graph.edges[0],destination:'v99'}]},'v1',e=>events.push(e))).toThrow(/existing/)
  expect(events).toEqual([])
})

test('cycles and converging branches agree with an independent iterative DFS reference', () => {
  for (const directed of [false,true]) for (let mask=0;mask<64;mask++) {
    const pairs = directed ? [[0,1],[1,0],[1,2],[2,3],[3,0],[0,2]] : [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]]
    const edges=pairs.filter((_,i)=>mask & (1<<i)), labels=['A','B','C','D']
    const graph=parseGraph(labels.join(','),edges.map(([a,b])=>`${labels[a]}-${labels[b]}`).join('\n'),directed)
    for (let source=0;source<4;source++) {
      const pending=[source], seen=new Set<number>(), expected:number[]=[]
      while(pending.length) {
        const current=pending.pop()!
        if(seen.has(current)) continue
        seen.add(current);expected.push(current)
        const neighbors=edges.flatMap(([a,b])=>a===current?[b]:!directed&&b===current?[a]:[]).sort((a,b)=>b-a)
        pending.push(...neighbors)
      }
      const trace=createDFSTrace(graph,graph.vertices[source].id), last=trace.at(-1)!
      expect(last.order).toEqual(expected.map(i=>graph.vertices[i].id))
      expect(new Set(last.processed).size).toBe(last.order.length)
      expect(last.treeEdges.length).toBe(last.order.length-1)
    }
  }
})
