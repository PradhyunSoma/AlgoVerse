import { expect, test } from 'vitest'
import { parseGraph } from './graphInput'
import { DIJKSTRA_EDGES, DIJKSTRA_VERTICES } from './graphWeights'
import { dijkstra } from './dijkstra'
import { createDijkstraTrace } from './dijkstraTrace'
import { dijkstraCode } from './dijkstraCode'
import { reconstructPath } from './shortestPath'
import { MinHeap } from './minHeap'
import { compareLabels, type Graph, type VertexId } from './graphModel'
import { createBFSTrace } from './bfsTrace'
import { createDFSTrace } from './dfsTrace'
import { layoutGraph } from './graphLayout'
import { weightLabels } from './weightLabels'

const sample=()=>parseGraph(DIJKSTRA_VERTICES,DIJKSTRA_EDGES,false)
const last=(g:Graph,start:VertexId|null=g.vertices[0]?.id??null)=>createDijkstraTrace(g,start).at(-1)!
test('weighted sample has the expected final distances, predecessors and A-to-E path',()=>{
  const graph=sample(),step=last(graph)
  expect(step.distances).toEqual({v1:0,v2:3,v3:1,v4:4,v5:7})
  expect(step.parents).toEqual({v1:null,v2:'v3',v3:'v1',v4:'v2',v5:'v4'})
  expect(step.finalized).toEqual(['v1','v3','v2','v4','v5'])
  expect(reconstructPath(step,'v5')).toEqual({status:'ready',vertices:['v1','v3','v2','v4','v5'],edges:['e2','e3','e4','e6'],cost:7})
  expect(step.unreachable).toEqual([]);expect(step.heap).toEqual([])
})

test.each([
  ['', '', false, {}],['A','',false,{v1:0}],['A,B,C','',false,{v1:0,v2:Infinity,v3:Infinity}],
  ['A,B,C,D','A-B: 2\nC-D: 1',false,{v1:0,v2:2,v3:Infinity,v4:Infinity}],
  ['A,B,C','B-A: 1\nB-C: 2',true,{v1:0,v2:Infinity,v3:Infinity}],
  ['A,B,C','A-B: 0\nB-C: 0\nC-A: 0',false,{v1:0,v2:0,v3:0}],
  ['A,B,C','A-B: 9\nA-C: 1\nC-B: 2',true,{v1:0,v2:3,v3:1}],
  ['A,B,C','A-B: 2\nB-C: 3\nC-A: 1',true,{v1:0,v2:2,v3:5}],
] as const)('handles %s / %s directed=%s',(vertices,edges,directed,expected)=>{
  const graph=parseGraph(vertices,edges,directed),step=last(graph)
  expect(step.distances).toEqual(expected)
  expect(new Set(step.finalized).size).toBe(step.finalized.length)
  for(const v of graph.vertices)expect(reconstructPath(step,v.id).status).toBe(Number.isFinite(step.distances[v.id])?'ready':'unreachable')
})

test.each(['-1','1.5','NaN','Infinity','1e2','100','','+2','0x10'])('rejects malformed weight %s',weight=>{
  expect(()=>parseGraph('A,B',`A-B: ${weight}`,false)).toThrow(/weight/i)
})
test.each([-1,Infinity,-Infinity,NaN,0.5,100])('model validation rejects weight %s before execution',weight=>{
  const graph=sample(),events:unknown[]=[]
  expect(()=>dijkstra({...graph,edges:[{...graph.edges[0],weight}]},'v1',e=>events.push(e))).toThrow(/nonnegative/)
  expect(events).toEqual([])
})

test('weight edits preserve identity, reject parallel edges, and BFS/DFS ignore weights',()=>{
  const graph=parseGraph('A,B,C','A-B\nB-C: 0\nA-C: 99',false),copy=structuredClone(graph)
  expect(graph.edges.map(e=>e.weight)).toEqual([1,0,99])
  const changed=parseGraph('A,B,C','A-B: 9\nB-C: 8\nA-C: 1',false,graph)
  expect(changed.edges.map(e=>e.id)).toEqual(graph.edges.map(e=>e.id))
  expect(changed.vertices).toEqual(graph.vertices)
  expect(()=>parseGraph('A,B','A-B: 0\nB-A: 2',false,graph)).toThrow(/Duplicate/)
  expect(createBFSTrace(changed,'v1').at(-1)!.order).toEqual(createBFSTrace(graph,'v1').at(-1)!.order)
  expect(createDFSTrace(changed,'v1').at(-1)!.order).toEqual(createDFSTrace(graph,'v1').at(-1)!.order)
  expect(graph).toEqual(copy)
})

test('binary heap retains its parent invariant and extracts sorted values including duplicates',()=>{
  const heap=new MinHeap<number>((a,b)=>a-b),values=[9,2,5,0,2,8,1,7,3]
  expect(heap.pop()).toBeUndefined()
  for(const value of values) {
    heap.push(value);const array=heap.snapshot()
    array.forEach((v,i)=>{if(i)expect(v).toBeGreaterThanOrEqual(array[Math.floor((i-1)/2)])})
  }
  const result:number[]=[];while(heap.size)result.push(heap.pop()!)
  expect(result).toEqual([...values].sort((a,b)=>a-b))
  expect(heap.snapshot()).toEqual([])
})

test('ties use alphabetical labels and equal alternatives never overwrite predecessors, including zero edges',()=>{
  const graph=parseGraph('D,C,B,A','A-C: 1\nA-B: 1\nB-D: 0\nC-D: 0',false)
  const trace=createDijkstraTrace(graph,'v4'),step=trace.at(-1)!
  expect(step.finalized).toEqual(['v4','v3','v2','v1'])
  expect(step.parents.v1).toBe('v3')
  expect(trace.some(s=>s.kind==='skip'&&s.comparison?.alternative===s.comparison?.previous)).toBe(true)
  expect(createDijkstraTrace(graph,'v4')).toEqual(trace)
})

test('snapshots exactly reflect heap insertion/extraction, stale handling, relaxation, predecessors and code IDs',()=>{
  const graph=sample(),trace=createDijkstraTrace(graph,'v1')
  expect(trace[0].distances).toEqual({v1:Infinity,v2:Infinity,v3:Infinity,v4:Infinity,v5:Infinity})
  expect(trace.filter(s=>s.kind==='stale').map(s=>[s.extracted!.vertex,s.extracted!.distance])).toEqual([['v2',4],['v4',6],['v5',10]])
  const labels=new Map(graph.vertices.map(v=>[v.id,v]))
  const compare=(a:typeof trace[number]['heap'][number],b:typeof a)=>a.distance-b.distance||compareLabels(labels.get(a.vertex)!,labels.get(b.vertex)!)||a.sequence-b.sequence
  trace.forEach((step,i)=>{
    const before=trace[i-1]
    expect(dijkstraCode.some(line=>line.id===step.lineId)).toBe(true)
    expect(step.lineId).toBe(step.kind)
    expect(new Set(step.heap.map(e=>e.sequence)).size).toBe(step.heap.length)
    step.heap.forEach((entry,index)=>{if(index)expect(compare(step.heap[Math.floor((index-1)/2)],entry)).toBeLessThanOrEqual(0)})
    if(step.kind==='extract') {
      expect(step.extracted).toEqual([...before.heap].sort(compare)[0])
      expect([...step.heap].sort(compare)).toEqual(before.heap.filter(e=>e.sequence!==step.extracted!.sequence).sort(compare))
    } else if(step.kind==='enqueue'||step.kind==='enqueue-start')expect([...step.heap].sort(compare)).toEqual([...before.heap,step.inserted!].sort(compare))
    else if(before)expect(step.heap).toEqual(before.heap)
    if(step.kind==='relax') {
      expect(step.comparison!.alternative).toBeLessThan(step.comparison!.previous)
      expect(step.distances).toEqual({...before.distances,[step.neighbor!]:step.comparison!.alternative})
      expect(step.parents).toEqual(before.parents)
    } else if(step.kind==='predecessor') {
      expect(step.parents).toEqual({...before.parents,[step.neighbor!]:step.active})
      expect(step.predecessorEdges).toEqual({...before.predecessorEdges,[step.neighbor!]:step.inspectedEdge})
    } else if(step.kind==='skip'||step.kind==='stale') {
      expect(step.distances).toEqual(before.distances);expect(step.parents).toEqual(before.parents);expect(step.finalized).toEqual(before.finalized)
    }
    if(step.kind==='finalize') {
      expect(step.extracted!.distance).toBe(step.distances[step.active!])
      expect(before.finalized).not.toContain(step.active)
      expect(step.finalized).toEqual([...before.finalized,step.active])
    }
    for(const id of step.finalized)expect(step.distances[id]).toBe(trace.at(-1)!.distances[id])
    if(step.kind!=='complete')expect(step.unreachable).toEqual([])
  })
  const example=trace.find(s=>s.kind==='calculate'&&s.active==='v3'&&s.neighbor==='v2')!
  expect(example.comparison).toEqual({from:'v3',to:'v2',weight:2,base:1,alternative:3,previous:4})
})

test('traces deeply freeze snapshots and preserve input, IDs, and early states',()=>{
  const graph=sample(),copy=structuredClone(graph),trace=createDijkstraTrace(graph,'v1')
  expect(graph).toEqual(copy);expect(Object.isFrozen(trace)).toBe(true)
  for(const step of trace) {
    expect(step.graph).toEqual(copy);expect(Object.isFrozen(step)).toBe(true)
    for(const key of ['distances','parents','predecessorEdges','finalized','heap','treeEdges','unreachable','graph'] as const)expect(Object.isFrozen(step[key])).toBe(true)
    expect(step.heap.every(Object.isFrozen)).toBe(true)
    for(const object of [step.extracted,step.inserted,step.comparison])if(object)expect(Object.isFrozen(object)).toBe(true)
  }
  expect(trace[0].heap).toEqual([]);expect(trace[0].distances.v1).toBe(Infinity)
})

test('path reconstruction waits for finalization, handles source=destination, and rejects corrupted chains',()=>{
  const graph=sample(),trace=createDijkstraTrace(graph,'v1'),step=trace.at(-1)!
  expect(reconstructPath(trace.find(s=>s.kind==='enqueue'&&s.neighbor==='v5')!,'v5').status).toBe('pending')
  expect(reconstructPath(trace.find(s=>s.kind==='finalize'&&s.active==='v5')!,'v5')).toEqual(reconstructPath(step,'v5'))
  expect(reconstructPath(step,'v1')).toEqual({status:'ready',vertices:['v1'],edges:[],cost:0})
  expect(reconstructPath(step,'v99').status).toBe('invalid')
  expect(reconstructPath(last(parseGraph('','',false)),null).status).toBe('empty')
  expect(reconstructPath({...step,distances:{...step.distances,v5:8}},'v5').status).toBe('invalid')
  const cycle=last(parseGraph('A,B,C','A-B: 0\nB-C: 0',false))
  expect(reconstructPath({...cycle,parents:{v1:null,v2:'v3',v3:'v2'},predecessorEdges:{v2:'e2',v3:'e2'}},'v2').status).toBe('invalid')
  expect(()=>dijkstra(graph,'v99')).toThrow(/starting vertex/)
  expect(()=>dijkstra(graph,null)).toThrow(/starting vertex/)
})

test('weighted distances match independent exhaustive simple-path costs on bounded cyclic graphs',()=>{
  const labels=['A','B','C','D'],pairs=[[0,1],[0,2],[1,2],[1,3],[2,3],[3,0]]
  for(const directed of [false,true])for(let seed=0;seed<32;seed++) {
    const edges=pairs.filter((_,i)=>seed&(1<<(i%5))).map(([a,b],i)=>({a,b,w:(seed+i)%4}))
    const graph=parseGraph(labels.join(','),edges.map(e=>`${labels[e.a]}-${labels[e.b]}: ${e.w}`).join('\n'),directed)
    for(let source=0;source<4;source++) {
      const expected=[Infinity,Infinity,Infinity,Infinity]
      function explore(vertex:number,cost:number,path:Set<number>) {
        expected[vertex]=Math.min(expected[vertex],cost)
        for(const e of edges) {
          const next=e.a===vertex?e.b:!directed&&e.b===vertex?e.a:null
          if(next!==null&&!path.has(next))explore(next,cost+e.w,new Set([...path,next]))
        }
      }
      explore(source,0,new Set([source]));const step=last(graph,graph.vertices[source].id)
      expect(graph.vertices.map(v=>step.distances[v.id])).toEqual(expected)
      for(const v of graph.vertices)if(Number.isFinite(step.distances[v.id]))expect(reconstructPath(step,v.id)).toMatchObject({status:'ready',cost:step.distances[v.id]})
    }
  }
})

test('weight plaques stay separate from vertices and each other on sample and dense reciprocal graphs',()=>{
  const dense=parseGraph('A,B,C,D,E', 'ABCDE'.split('').flatMap(a=>'ABCDE'.split('').filter(b=>a!==b).map(b=>`${a}-${b}: 99`)).join('\n'),true)
  for(const graph of [sample(),dense]) {
    const positions=layoutGraph(graph),plaques=weightLabels(graph,positions)
    expect(plaques.size).toBe(graph.edges.length)
    expect(weightLabels(graph,positions)).toEqual(plaques)
    for(const a of plaques.values()) {
      for(const vertex of positions.values())expect(Math.hypot(vertex.x-a.point.x,vertex.y-a.point.y)).toBeGreaterThan(77)
      for(const b of plaques.values())if(a!==b)expect(Math.abs(a.point.x-b.point.x)>42||Math.abs(a.point.y-b.point.y)>28).toBe(true)
    }
  }
})
