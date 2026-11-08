import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, expect, test, vi } from 'vitest'
import GraphsPage from './GraphsPage'
import { createBFSTrace } from './bfsTrace'
import { sampleGraph } from './graphInput'

afterEach(() => { cleanup(); vi.useRealTimers() })
const mount = () => render(<MemoryRouter><GraphsPage /></MemoryRouter>)
const button = (name: string) => screen.getByRole('button', { name })
const click = (name: string) => fireEvent.click(button(name))
const tick = (ms: number) => act(() => { vi.advanceTimersByTime(ms) })
const change = (label: RegExp | string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } })
function edit(vertices: string, edges: string, directed = false) {
  change(/Vertices · comma/, vertices); change(/Edges · one/, edges)
  change('Edge direction', directed ? 'directed' : 'undirected'); click('Apply Graph')
}
function snapshot() {
  return [screen.getByRole('img', { name: /Breadth-first search graph/ }).innerHTML,
    screen.getByRole('list', { name: 'BFS queue' }).innerHTML,
    screen.getByRole('region', { name: 'Traversal records, scroll if needed' }).innerHTML,
    screen.getByLabelText('BFS visit order').textContent,
    screen.getByRole('status').textContent,
    document.querySelector('[aria-current="step"]')?.getAttribute('data-line-id')]
}

test('all sample steps synchronize diagram, queue, order, pseudocode and exact backward restoration', () => {
  mount()
  const trace = createBFSTrace(sampleGraph(), 'v1'), snapshots: ReturnType<typeof snapshot>[] = []
  trace.forEach((step, index) => {
    expect(screen.getByRole('status')).toHaveTextContent(step.explanation)
    expect(document.querySelector('[aria-current="step"]')).toHaveAttribute('data-line-id', step.lineId)
    expect([...document.querySelectorAll('[data-queued-id]')].map(n => n.getAttribute('data-queued-id'))).toEqual(step.queue)
    expect([...document.querySelectorAll('[data-tree="true"]')].map(n => n.getAttribute('data-edge-id')).sort()).toEqual([...step.treeEdges].sort())
    expect(document.querySelector('[data-inspected="true"]')?.getAttribute('data-edge-id') ?? null).toBe(step.inspectedEdge)
    snapshots.push(snapshot())
    if (index < trace.length-1) click('Next Step')
  })
  expect(screen.getByLabelText('BFS visit order')).toHaveTextContent('A → B → C → D → E → F')
  expect(button('Next Step')).toBeDisabled()
  expect(screen.getByLabelText('Unreachable vertices')).toHaveTextContent('Unreachable: none')
  for (let index=trace.length-2; index>=0; index--) { click('Previous Step'); expect(snapshot()).toEqual(snapshots[index]) }
  expect(button('Previous Step')).toBeDisabled()
  click('Next Step'); expect(snapshot()).toEqual(snapshots[1])
})

test.each([0.5, 1, 2, 4])('play, pause, reset, replay, stop at final, and speed %s', speed => {
  vi.useFakeTimers(); mount(); edit('A,B', 'A-B')
  const initial = snapshot()
  change('Speed', String(speed)); click('Play')
  tick(1000/speed - 1); expect(snapshot()).toEqual(initial)
  tick(1); expect(document.querySelector('[aria-current="step"]')).toHaveAttribute('data-line-id','queue-init')
  click('Pause'); const paused = snapshot(); tick(5000); expect(snapshot()).toEqual(paused)
  click('Play'); tick(1000/speed); click('Next Step'); const stepped = snapshot(); tick(5000); expect(snapshot()).toEqual(stepped)
  click('Reset'); expect(snapshot()).toEqual(initial)
  click('Play')
  for (let i=0;i<50;i++) tick(1000/speed)
  expect(button('Replay')).toBeEnabled(); expect(button('Next Step')).toBeDisabled()
  expect(screen.getByLabelText('BFS visit order')).toHaveTextContent('A → B')
  expect(vi.getTimerCount()).toBe(0)
  click('Replay'); expect(snapshot()).toEqual(initial)
  tick(1000/speed); expect(snapshot()).not.toEqual(initial)
  click('Reset'); expect(vi.getTimerCount()).toBe(0)
})

test('invalid edits preserve exact graph and step; valid edits retain IDs and remove stale references', () => {
  mount(); click('Next Step'); click('Next Step'); const before = snapshot()
  edit('A,B', 'A-Z')
  expect(screen.getByRole('alert')).toHaveTextContent('Unknown vertex')
  expect(snapshot()).toEqual(before)
  edit('A,B', 'A-A'); expect(screen.getByRole('alert')).toHaveTextContent('Self-loops')
  expect(snapshot()).toEqual(before)
  edit('A,A', ''); expect(screen.getByRole('alert')).toHaveTextContent('unique')
  edit('A,B,Z', 'B-A\nB-Z')
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  expect(document.querySelector('[data-vertex-id="v1"]')).toBeInTheDocument()
  expect(document.querySelector('[data-vertex-id="v7"]')).toHaveTextContent('Z')
  expect(document.querySelector('[data-edge-id="e1"]')).toBeInTheDocument()
  expect(document.querySelector('[data-vertex-id="v3"]')).not.toBeInTheDocument()
  expect(button('Previous Step')).toBeDisabled()
  change('Starting vertex', 'v7'); edit('B,Z', 'B-Z')
  expect(screen.getByLabelText('Starting vertex')).toHaveValue('v7')
  edit('B', ''); expect(screen.getByLabelText('Starting vertex')).toHaveValue('v2')
  click('Restore Sample'); expect(screen.getByLabelText('Starting vertex')).toHaveDisplayValue('A')
})

test('directed reciprocal edges, unreachable results, isolated vertices, empty graph, and restore', () => {
  mount(); edit('A,B,C,D', 'A-B\nB-A\nC-D', true)
  expect(document.querySelectorAll('.graph-edge path[marker-end]')).toHaveLength(3)
  while (!(button('Next Step') as HTMLButtonElement).disabled) click('Next Step')
  expect(screen.getByLabelText('BFS visit order')).toHaveTextContent('A → B')
  expect(screen.getByLabelText('Unreachable vertices')).toHaveTextContent('Unreachable: C, D')
  const rows = within(screen.getByRole('table')).getAllByRole('row')
  expect(rows[2]).toHaveTextContent('B'); expect(rows[2]).toHaveTextContent('1')
  expect(document.querySelector('[data-vertex-id="v3"]')).toHaveAttribute('data-state', 'Unreachable')
  edit('A', '')
  while (!(button('Next Step') as HTMLButtonElement).disabled) click('Next Step')
  expect(screen.getByLabelText('BFS visit order').textContent).toBe('A')
  click('Clear Graph'); expect(screen.getByLabelText('Starting vertex')).toBeDisabled()
  click('Next Step'); click('Next Step'); expect(screen.getByRole('status')).toHaveTextContent('graph is empty')
  click('Restore Sample'); expect(screen.getByLabelText('Starting vertex')).toHaveDisplayValue('A')
  expect(screen.getByLabelText('Edge direction')).toHaveValue('undirected')
  expect(document.querySelectorAll('.graph-node')).toHaveLength(6)
})

test('start changes, edits, invalid edits, restore, clear, and unmount cancel active timers', () => {
  vi.useFakeTimers(); const view = mount()
  click('Play'); tick(1000); change('Starting vertex', 'v2')
  expect(button('Play')).toBeEnabled(); const reset = snapshot(); tick(5000); expect(snapshot()).toEqual(reset)
  click('Play'); tick(1000); edit('A,B,C', 'A-B', true)
  expect(button('Previous Step')).toBeDisabled(); expect(button('Play')).toBeEnabled()
  click('Play'); tick(1000); const before = snapshot(); edit('A,B', 'A-C')
  tick(5000); expect(snapshot()).toEqual(before); expect(button('Play')).toBeEnabled()
  click('Play'); click('Clear Graph'); tick(5000); expect(button('Previous Step')).toBeDisabled()
  click('Play'); click('Restore Sample'); tick(5000); expect(button('Previous Step')).toBeDisabled()
  click('Play'); view.unmount(); expect(vi.getTimerCount()).toBe(0)
})

test('editor and scroll regions have accessible labels and keyboard focus targets', () => {
  mount()
  expect(screen.getByLabelText(/Vertices · comma/)).toHaveAccessibleDescription(/10 vertices/)
  expect(screen.getByLabelText(/Edges · one/)).toHaveAccessibleDescription(/Remove a vertex/)
  const diagram = screen.getByRole('region', { name: 'Graph diagram, scroll with arrow keys' })
  diagram.focus(); expect(diagram).toHaveFocus()
  expect(screen.getByRole('img', { name: /Breadth-first search graph/ })).toHaveAccessibleName(/Start: A/)
  expect(screen.getByRole('progressbar', { name: 'Execution progress' })).toBeInTheDocument()
})
