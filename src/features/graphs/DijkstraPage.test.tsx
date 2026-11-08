import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, expect, test, vi } from 'vitest'
import GraphsPage from './GraphsPage'
import { parseGraph, sampleGraph } from './graphInput'
import { DIJKSTRA_EDGES, DIJKSTRA_VERTICES } from './graphWeights'
import { createDijkstraTrace } from './dijkstraTrace'

afterEach(()=>{cleanup();vi.useRealTimers()})
const button=(name:string)=>screen.getByRole('button',{name})
const click=(name:string)=>fireEvent.click(button(name))
const change=(label:string|RegExp,value:string)=>fireEvent.change(screen.getByLabelText(label),{target:{value}})
const tick=(ms:number)=>act(()=>{vi.advanceTimersByTime(ms)})
function mount(){const view=render(<MemoryRouter><GraphsPage /></MemoryRouter>);change('Algorithm','dijkstra');return view}
function edit(vertices:string,edges:string,directed=false){change(/Vertices · comma/,vertices);change(/Edges · one/,edges);change('Edge direction',directed?'directed':'undirected');click('Apply Graph')}
function finish(){for(let i=0;i<500&&!(button('Next Step') as HTMLButtonElement).disabled;i++)click('Next Step');expect(button('Next Step')).toBeDisabled()}
function snapshot(){return [
  screen.getByRole('img',{name:/Dijkstra shortest-path graph/}).innerHTML,
  screen.getByRole('list',{name:'Dijkstra priority queue'}).innerHTML,
  screen.getByRole('region',{name:'Dijkstra distance records'}).innerHTML,
  screen.getByRole('region',{name:'Edge relaxation'}).innerHTML,
  screen.getByRole('region',{name:'Shortest path to a destination'}).innerHTML,
  screen.getByRole('status').textContent,
  document.querySelector('[aria-current="step"]')?.getAttribute('data-line-id'),
]}

test('every weighted sample step synchronizes heap, distances, relaxation, code and finalized path, including reverse navigation',()=>{
  mount();click('Restore Sample Graph')
  const graph=parseGraph(DIJKSTRA_VERTICES,DIJKSTRA_EDGES,false,sampleGraph()),trace=createDijkstraTrace(graph,'v1')
  const snapshots:ReturnType<typeof snapshot>[]=[],positions=[...document.querySelectorAll('.graph-node')].map(n=>n.getAttribute('transform'))
  expect(screen.getByLabelText('Destination vertex')).toHaveDisplayValue('E')
  trace.forEach((step,index)=>{
    expect(screen.getByRole('status')).toHaveTextContent(step.explanation)
    expect(document.querySelector('[aria-current="step"]')).toHaveAttribute('data-line-id',step.lineId)
    expect([...document.querySelectorAll('[data-entry-id]')].map(n=>Number(n.getAttribute('data-entry-id')))).toEqual(step.heap.map(e=>e.sequence))
    expect([...document.querySelectorAll('.graph-node')].map(n=>n.getAttribute('transform'))).toEqual(positions)
    expect([...document.querySelectorAll('.graph-weight text')].map(n=>Number(n.textContent))).toEqual(graph.edges.map(e=>e.weight))
    for(const entry of step.heap)expect(document.querySelector(`[data-entry-id="${entry.sequence}"]`)).toHaveAttribute('data-stale',String(step.finalized.includes(entry.vertex)||step.distances[entry.vertex]!==entry.distance))
    if(step.kind==='relax')expect(document.querySelector(`[data-distance-id="${step.neighbor}"]`)).toHaveTextContent('Update pending')
    if(step.finalized.includes('v5')){
      expect(screen.getByLabelText('Shortest path')).toHaveTextContent('A → C → B → D → E')
      expect(screen.getByLabelText('Shortest path cost')).toHaveTextContent('Total cost: 7')
      expect(document.querySelectorAll('.graph-edge[data-shortest-path="true"]')).toHaveLength(4)
    }else{
      expect(screen.queryByLabelText('Shortest path')).not.toBeInTheDocument()
      expect(document.querySelectorAll('.graph-edge[data-shortest-path="true"]')).toHaveLength(0)
    }
    snapshots.push(snapshot());if(index<trace.length-1)click('Next Step')
  })
  expect(screen.getByLabelText('Finalization order')).toHaveTextContent('A → C → B → D → E')
  for(let i=trace.length-2;i>=0;i--){click('Previous Step');expect(snapshot()).toEqual(snapshots[i])}
  expect(button('Previous Step')).toBeDisabled();click('Next Step');expect(snapshot()).toEqual(snapshots[1])
// This checks all 107 snapshots in both directions while the full suite runs in parallel.
},15000)

test.each([0.5,1,2,4])('weighted playback supports %s speed, pause, reset and replay',speed=>{
  vi.useFakeTimers();mount();edit('A,B','A-B: 0')
  const initial=snapshot();change('Speed',String(speed));click('Play')
  tick(1000/speed-1);expect(snapshot()).toEqual(initial)
  tick(1);expect(document.querySelector('[aria-current="step"]')).toHaveAttribute('data-line-id','source')
  click('Pause');const paused=snapshot();tick(4000);expect(snapshot()).toEqual(paused)
  click('Play');tick(1000/speed);click('Next Step');const manual=snapshot();tick(4000);expect(snapshot()).toEqual(manual)
  click('Reset');expect(snapshot()).toEqual(initial)
  click('Play');for(let i=0;i<70;i++)tick(1000/speed)
  expect(button('Replay')).toBeEnabled();expect(vi.getTimerCount()).toBe(0)
  expect(screen.getByLabelText('Shortest path cost')).toHaveTextContent('Total cost: 0')
  click('Replay');expect(snapshot()).toEqual(initial);tick(1000/speed);expect(snapshot()).not.toEqual(initial)
  click('Reset');expect(vi.getTimerCount()).toBe(0)
})

test('changing speed or destination pauses or reschedules correctly without skipped steps or tentative final routes',()=>{
  vi.useFakeTimers();mount();click('Restore Sample Graph');click('Play');tick(400);change('Speed','4')
  tick(249);expect(document.querySelector('[aria-current="step"]')).toHaveAttribute('data-line-id','initialize')
  tick(1);expect(document.querySelector('[aria-current="step"]')).toHaveAttribute('data-line-id','source')
  change('Destination vertex','v1');const before=snapshot();tick(4000);expect(snapshot()).toEqual(before)
  expect(screen.getByLabelText('Path availability')).toHaveTextContent('not finalized')
  finish();expect(screen.getByLabelText('Shortest path')).toHaveTextContent('A')
  expect(screen.getByLabelText('Shortest path cost')).toHaveTextContent('Total cost: 0')
  expect(document.querySelectorAll('.graph-edge[data-shortest-path="true"]')).toHaveLength(0)
})

test('switching all three algorithms during autoplay preserves custom weights, IDs, direction and source',()=>{
  vi.useFakeTimers();mount();edit('A,B,C,Z','Z-A: 9\nZ-B: 1\nB-A: 2\nA-C: 0',true);change('Starting vertex','v7');change('Destination vertex','v3')
  const input=screen.getByLabelText(/Edges · one/),ids=[...document.querySelectorAll('.graph-node')].map(n=>n.getAttribute('data-vertex-id'))
  for(const algorithm of ['bfs','dfs','dijkstra']){
    click('Play');tick(1000);change('Algorithm',algorithm);tick(4000)
    expect(button('Previous Step')).toBeDisabled();expect(button('Play')).toBeEnabled()
    expect(input).toHaveValue('Z-A: 9\nZ-B: 1\nB-A: 2\nA-C: 0')
    expect(screen.getByLabelText('Starting vertex')).toHaveValue('v7')
    expect(screen.getByLabelText('Edge direction')).toHaveValue('directed')
    expect([...document.querySelectorAll('.graph-node')].map(n=>n.getAttribute('data-vertex-id'))).toEqual(ids)
    if(algorithm!=='dijkstra'){expect(screen.queryByRole('list',{name:'Dijkstra priority queue'})).not.toBeInTheDocument();expect(document.querySelectorAll('[data-weight-edge]')).toHaveLength(0)}
  }
  expect(screen.getByLabelText('Destination vertex')).toHaveValue('v3')
  finish();expect(screen.getByLabelText('Shortest path')).toHaveTextContent('Z → B → A → C');expect(screen.getByLabelText('Shortest path cost')).toHaveTextContent('Total cost: 3')
})

test('invalid weights preserve exact preview; valid edits, source changes and unmount cancel timers',()=>{
  vi.useFakeTimers();const view=mount();click('Restore Sample Graph');click('Play');tick(1000)
  const before=snapshot();edit('A,B','A-B: -1');tick(4000)
  expect(screen.getByRole('alert')).toHaveTextContent('nonnegative');expect(snapshot()).toEqual(before)
  edit('A,B','A-B: Infinity');expect(screen.getByRole('alert')).toHaveTextContent('Invalid weight');expect(snapshot()).toEqual(before)
  click('Play');edit('A,B','A-B: 2',true);tick(4000);expect(button('Previous Step')).toBeDisabled()
  click('Play');change('Starting vertex','v2');tick(4000);expect(button('Previous Step')).toBeDisabled()
  click('Play');view.unmount();expect(vi.getTimerCount()).toBe(0)
})

test('unreachable, empty and singleton graphs provide honest path results and clearing/restoring works',()=>{
  mount();edit('A,B,C','A-B: 4',true);change('Destination vertex','v3');finish()
  expect(screen.getByLabelText('Path availability')).toHaveTextContent('No path exists')
  expect(document.querySelector('[data-distance-id="v3"]')).toHaveTextContent('∞')
  expect(document.querySelector('[data-distance-id="v3"]')).toHaveTextContent('Unreachable')
  click('Clear Graph');finish();expect(screen.getByLabelText('Destination vertex')).toBeDisabled()
  expect(screen.getByLabelText('Path availability')).toHaveTextContent('nonempty graph')
  edit('A','');finish();expect(screen.getByLabelText('Shortest path cost')).toHaveTextContent('Total cost: 0')
  click('Restore Sample Graph');expect(screen.getByLabelText('Starting vertex')).toHaveDisplayValue('A');expect(screen.getByLabelText('Destination vertex')).toHaveDisplayValue('E')
})

test('heap and distance panels support keyboard focus and inputs describe accepted weights',()=>{
  mount();expect(screen.getByLabelText(/Edges · one/)).toHaveAccessibleDescription(/integers from 0 to 99/)
  const queue=screen.getByRole('list',{name:'Dijkstra priority queue'});queue.focus();expect(queue).toHaveFocus()
  const table=screen.getByRole('region',{name:'Dijkstra distance records'});table.focus();expect(table).toHaveFocus()
})
