import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, expect, test, vi } from 'vitest'
import GraphsPage from './GraphsPage'
import { createDFSTrace } from './dfsTrace'
import { sampleGraph } from './graphInput'

afterEach(() => { cleanup(); vi.useRealTimers() })
const button = (name: string) => screen.getByRole('button', { name })
const click = (name: string) => fireEvent.click(button(name))
const change = (label: RegExp | string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } })
const tick = (ms: number) => act(() => { vi.advanceTimersByTime(ms) })
function mount() { const view = render(<MemoryRouter><GraphsPage /></MemoryRouter>); change('Algorithm','dfs'); return view }
function edit(vertices: string, edges: string, directed = false) {
  change(/Vertices · comma/, vertices); change(/Edges · one/, edges); change('Edge direction',directed?'directed':'undirected'); click('Apply Graph')
}
function snapshot() {
  return [screen.getByRole('img', { name: /Depth-first search graph/ }).innerHTML,
    screen.getByRole('list',{name:'DFS recursion stack'}).innerHTML,
    screen.getByRole('region',{name:'Traversal record'}).innerHTML,
    screen.getByRole('status').textContent,
    document.querySelector('[aria-current="step"]')?.getAttribute('data-line-id')]
}
function finish() { for(let i=0;i<250 && !(button('Next Step') as HTMLButtonElement).disabled;i++) click('Next Step'); expect(button('Next Step')).toBeDisabled() }

test('every DFS step and reverse step restores the exact stack, diagram, parents, orders and pseudocode', () => {
  mount()
  const trace=createDFSTrace(sampleGraph(),'v1'), snapshots: ReturnType<typeof snapshot>[]=[]
  const positions=[...document.querySelectorAll('.graph-node')].map(n=>n.getAttribute('transform'))
  trace.forEach((step,index)=>{
    expect(screen.getByRole('status')).toHaveTextContent(step.explanation)
    expect(document.querySelector('[aria-current="step"]')).toHaveAttribute('data-line-id',step.lineId)
    expect([...document.querySelectorAll('[data-frame-id]')].map(n=>n.getAttribute('data-frame-id'))).toEqual(step.stack.map(f=>f.vertex))
    expect([...document.querySelectorAll('.graph-node')].map(n=>n.getAttribute('transform'))).toEqual(positions)
    expect([...document.querySelectorAll('.graph-node[data-state="Processed"]')].map(n=>n.getAttribute('data-vertex-id')).sort()).toEqual([...step.processed].sort())
    expect([...document.querySelectorAll('[data-tree="true"]')].map(n=>n.getAttribute('data-edge-id')).sort()).toEqual([...step.treeEdges].sort())
    if(step.kind==='return') expect(document.querySelector(`[data-frame-id="${step.active}"]`)).toHaveAttribute('data-returning','true')
    if(step.kind==='backtrack') {
      expect(document.querySelector(`[data-frame-id="${step.returned!.vertex}"]`)).not.toBeInTheDocument()
      expect(document.querySelector(`[data-vertex-id="${step.returned!.vertex}"]`)).toHaveAttribute('data-exited','true')
      expect(document.querySelector(`[data-edge-id="${step.returned!.edge}"]`)).toHaveAttribute('data-backtracking','true')
    }
    snapshots.push(snapshot()); if(index<trace.length-1)click('Next Step')
  })
  expect(screen.getByLabelText('DFS discovery order')).toHaveTextContent('A → B → D → E → F → C')
  expect(screen.getByLabelText('DFS completion order')).toHaveTextContent('D → C → F → E → B → A')
  expect(screen.getByRole('list',{name:'DFS recursion stack'})).toBeEmptyDOMElement()
  expect(screen.queryByRole('columnheader',{name:'Distance'})).not.toBeInTheDocument()
  for(let i=trace.length-2;i>=0;i--) { click('Previous Step');expect(snapshot()).toEqual(snapshots[i]) }
  expect(button('Previous Step')).toBeDisabled()
  click('Next Step');expect(snapshot()).toEqual(snapshots[1])
})

test.each([0.5,1,2,4])('DFS supports play, pause, reset, replay, and %s speed',speed=>{
  vi.useFakeTimers();mount();edit('A,B','A-B')
  const initial=snapshot();change('Speed',String(speed));click('Play')
  tick(1000/speed-1);expect(snapshot()).toEqual(initial)
  tick(1);expect(document.querySelector('[aria-current="step"]')).toHaveAttribute('data-line-id','start-call')
  click('Pause');const paused=snapshot();tick(5000);expect(snapshot()).toEqual(paused)
  click('Play');tick(1000/speed);click('Next Step');const next=snapshot();tick(5000);expect(snapshot()).toEqual(next)
  click('Reset');expect(snapshot()).toEqual(initial)
  click('Play');for(let i=0;i<70;i++)tick(1000/speed)
  expect(button('Replay')).toBeEnabled();expect(button('Next Step')).toBeDisabled();expect(vi.getTimerCount()).toBe(0)
  expect(screen.getByLabelText('DFS discovery order')).toHaveTextContent('A → B')
  click('Replay');expect(snapshot()).toEqual(initial);tick(1000/speed);expect(snapshot()).not.toEqual(initial)
  click('Reset');expect(vi.getTimerCount()).toBe(0)
})

test('speed changes replace the pending timer without skipping steps',()=>{
  vi.useFakeTimers();mount();click('Play');tick(400);change('Speed','4')
  tick(249);expect(document.querySelector('[aria-current="step"]')).toHaveAttribute('data-line-id','initialize')
  tick(1);expect(document.querySelector('[aria-current="step"]')).toHaveAttribute('data-line-id','start-call')
  tick(250);expect(document.querySelector('[aria-current="step"]')).toHaveAttribute('data-line-id','enter')
  click('Pause');tick(1000);expect(document.querySelector('[aria-current="step"]')).toHaveAttribute('data-line-id','enter')
})

test('switching either way during autoplay retains custom graph, IDs, layout, direction and start',()=>{
  vi.useFakeTimers();mount();edit('A,B,C,Z','Z-B\nB-A\nZ-C',true);change('Starting vertex','v7')
  const vertices=screen.getByLabelText(/Vertices · comma/),edges=screen.getByLabelText(/Edges · one/)
  const identities=[...document.querySelectorAll('.graph-node')].map(n=>[n.getAttribute('data-vertex-id'),n.getAttribute('transform')])
  click('Play');tick(1000);change('Algorithm','bfs')
  expect(screen.getByRole('heading',{name:'Breadth-First Search',level:1})).toBeVisible()
  expect(button('Previous Step')).toBeDisabled();expect(button('Play')).toBeEnabled()
  expect(screen.queryByRole('list',{name:'DFS recursion stack'})).not.toBeInTheDocument()
  expect(screen.getByRole('list',{name:'BFS queue'})).toBeEmptyDOMElement()
  tick(5000);expect(button('Previous Step')).toBeDisabled()
  click('Play');tick(1000);change('Algorithm','dfs');tick(5000)
  expect(button('Previous Step')).toBeDisabled();expect(vi.getTimerCount()).toBe(0)
  expect(screen.getByLabelText('Starting vertex')).toHaveValue('v7')
  expect(screen.getByLabelText('Edge direction')).toHaveValue('directed')
  expect(vertices).toHaveValue('A,B,C,Z');expect(edges).toHaveValue('Z-B\nB-A\nZ-C')
  expect([...document.querySelectorAll('.graph-node')].map(n=>[n.getAttribute('data-vertex-id'),n.getAttribute('transform')])).toEqual(identities)
  expect(document.querySelectorAll('[data-exited="true"],[data-backtracking="true"]')).toHaveLength(0)
  finish();expect(screen.getByLabelText('DFS discovery order')).toHaveTextContent('Z → B → A → C')
  change('Algorithm','bfs');finish();expect(screen.getByLabelText('BFS visit order')).toHaveTextContent('Z → B → C → A')
})

test('DFS validates edits, preserves failed previews, handles empty/isolated/disconnected graphs and restores sample',()=>{
  mount();edit('A,B,C,D','A-B\nC-D',true);click('Next Step');click('Next Step');const before=snapshot()
  edit('A,B','A-Z');expect(screen.getByRole('alert')).toHaveTextContent('Unknown vertex');expect(snapshot()).toEqual(before)
  finish();expect(screen.getByLabelText('Unreachable vertices')).toHaveTextContent('Unreachable: C, D')
  change('Starting vertex','v3');finish();expect(screen.getByLabelText('DFS discovery order')).toHaveTextContent('C → D')
  edit('A','');finish();expect(screen.getByLabelText('DFS discovery order').textContent).toBe('A')
  expect(screen.getByLabelText('DFS completion order').textContent).toBe('A')
  click('Clear Graph');expect(screen.getByLabelText('Starting vertex')).toBeDisabled();finish()
  expect(screen.getByRole('status')).toHaveTextContent('graph is empty')
  click('Restore Sample');expect(screen.getByLabelText('Algorithm')).toHaveValue('dfs');expect(screen.getByLabelText('Starting vertex')).toHaveDisplayValue('A')
  finish();expect(screen.getByLabelText('DFS discovery order')).toHaveTextContent('A → B → D → E → F → C')
})

test('DFS graph/start edits during playback and page unmount cancel timers; stack is keyboard focusable',()=>{
  vi.useFakeTimers();const view=mount();click('Play');tick(1000);change('Starting vertex','v2')
  const reset=snapshot();tick(5000);expect(snapshot()).toEqual(reset)
  click('Play');edit('A,B','A-B');expect(button('Previous Step')).toBeDisabled();tick(5000);expect(button('Previous Step')).toBeDisabled()
  click('Play');tick(1000);const before=snapshot();edit('A,B','A-Z');tick(5000);expect(snapshot()).toEqual(before)
  click('Restore Sample');const stack=screen.getByRole('list',{name:'DFS recursion stack'});stack.focus();expect(stack).toHaveFocus()
  click('Play');view.unmount();tick(0) // Flush jsdom focus/blur bookkeeping, without advancing a playback interval.
  expect(vi.getTimerCount()).toBe(0)
})
