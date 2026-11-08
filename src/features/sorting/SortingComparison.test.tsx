import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, expect, test, vi } from 'vitest'
import SortingPage from './SortingPage'
import { createComparisonRuns } from './comparison'
import { algorithms } from './sortingCatalog'

afterEach(() => { cleanup(); vi.useRealTimers() })
function mount() { return render(<MemoryRouter><SortingPage /></MemoryRouter>) }
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
const change = (name: string, value: string) => fireEvent.change(screen.getByLabelText(name), { target: { value } })
const compare = () => fireEvent.click(screen.getByRole('tab', { name: 'Compare' }))
function apply(text: string) { change('Comma-separated integers', text); click('Apply Array') }
function panels() { return screen.getAllByRole('region', { name: /Sort comparison$/ }) }
// Live-region mode changes with playback; compare the underlying trace presentation.
function state() { return panels().map(p => ({ step: p.getAttribute('data-step'), content: p.innerHTML.replace(/aria-live="(?:off|polite)"/g, '') })) }
function finish() { for (let i = 0; i < 400 && !(screen.getByRole('button', { name: 'Next Step' }) as HTMLButtonElement).disabled; i++) click('Next Step') }
const tick = (ms: number) => act(() => vi.advanceTimersByTime(ms))

test('two traces restore exact arrays, explanations, metrics and independent progress', () => {
  mount(); compare(); apply('2,1')
  const runs = createComparisonRuns(['bubble','quick'], [2,1])
  const stored = runs.map(() => new Map<number,string>())
  function verify(indices: number[]) {
    panels().forEach((panel, slot) => {
      const step = runs[slot].trace[indices[slot]]
      expect(panel).toHaveAttribute('data-step', String(indices[slot]))
      expect(within(panel).getByRole('status')).toHaveTextContent(step.explanation)
      expect([...panel.querySelectorAll('.array-column')].map(n => Number(n.getAttribute('data-value')))).toEqual(step.values)
      for (const [key, value] of Object.entries(step.metrics)) expect(panel.querySelector(`[data-metric="${key}"]`)).toHaveTextContent(String(value))
      expect(within(panel).getByRole('progressbar')).toHaveAttribute('value', String(indices[slot]))
      if (stored[slot].has(indices[slot])) expect(panel.innerHTML).toBe(stored[slot].get(indices[slot]))
      stored[slot].set(indices[slot], panel.innerHTML)
    })
  }
  let indices = [0,0]; verify(indices)
  for (let i=1;i<Math.max(...runs.map(r => r.trace.length));i++) {
    click('Next Step'); indices=indices.map((v,slot)=>Math.min(v+1,runs[slot].trace.length-1)); verify(indices)
  }
  expect(screen.getByRole('heading',{name:'Completed comparison'})).toBeVisible()
  const table = screen.getByRole('table')
  const bubble = within(table).getByRole('row',{name:/Bubble Sort/})
  expect([...bubble.querySelectorAll('td')].slice(0,5).map(n=>n.textContent)).toEqual(['2','1','1','2','0'])
  expect(table).toHaveTextContent('O(n²)')
  expect(table).toHaveTextContent('O(log n)')
  while(indices.some(v=>v>0)) { click('Previous Step'); indices=indices.map(v=>Math.max(0,v-1)); verify(indices) }
  expect(screen.queryByRole('heading',{name:'Completed comparison'})).not.toBeInTheDocument()
  expect(screen.getByRole('button',{name:'Previous Step'})).toBeDisabled()
},15000)

test('three algorithms retain insertion keys, merge buffers and recursion without mislabeling shifts', () => {
  mount(); compare(); change('Algorithm 1','insertion'); change('Algorithm 2','merge'); change('Number of algorithms','3')
  expect(panels()).toHaveLength(3)
  expect(document.querySelector('.comparison-grid')).toHaveAttribute('data-count','3')
  expect(within(screen.getByLabelText('Algorithm 3')).getByRole('option',{name:'Insertion Sort'})).toBeDisabled()
  const selected = screen.getByLabelText('Algorithm 3') as HTMLSelectElement
  const old = selected.value; change('Algorithm 3','insertion'); expect(selected.value).toBe(old)
  apply('2,1')
  let sawKey=false, sawBuffer=false
  for(let i=0;i<70 && !(screen.getByRole('button',{name:'Next Step'}) as HTMLButtonElement).disabled;i++) {
    const insertion=screen.getByRole('region',{name:'Insertion Sort comparison'}), merge=screen.getByRole('region',{name:'Merge Sort comparison'})
    if (insertion.querySelector('[data-held-value="1"]')) { sawKey=true; expect(insertion.querySelector('[data-state="Vacant"]')).toBeInTheDocument() }
    if (within(merge).queryByRole('list',{name:'Temporary merge buffer'})) sawBuffer=true
    expect(insertion.querySelector('[data-metric="swaps"]')).toHaveTextContent('0')
    click('Next Step')
  }
  expect(sawKey).toBe(true); expect(sawBuffer).toBe(true)
  expect(screen.getByRole('heading',{name:'Divide, then merge'})).toBeVisible()
  expect(screen.getByRole('table')).toHaveTextContent('Insertion Sort')
  expect(screen.getByRole('table')).toHaveTextContent('Merge Sort')
  change('Number of algorithms','2');expect(panels()).toHaveLength(2)
  expect(panels().every(p=>p.getAttribute('data-step')==='0')).toBe(true)
})

test.each([0.5,1,2,4])('comparison autoplay, pause, reset, replay and all-finished stop at %s speed', speed => {
  vi.useFakeTimers();mount();compare();apply('2,1');change('Speed',String(speed))
  const initial=state();click('Play');tick(1000/speed-1);expect(state()).toEqual(initial)
  tick(1);expect(panels().map(p=>p.getAttribute('data-step'))).toEqual(['1','1'])
  click('Pause');const paused=state();tick(5000);expect(state()).toEqual(paused)
  click('Play');click('Previous Step');expect(state()).toEqual(initial);expect(vi.getTimerCount()).toBe(0)
  click('Play');for(let i=0;i<65;i++)tick(1000/speed)
  expect(screen.getByRole('button',{name:'Replay'})).toBeEnabled();expect(vi.getTimerCount()).toBe(0)
  expect(screen.getByRole('heading',{name:'Completed comparison'})).toBeVisible()
  click('Replay');expect(state()).toEqual(initial);tick(1000/speed);expect(state()).not.toEqual(initial)
  click('Reset');expect(state()).toEqual(initial);expect(vi.getTimerCount()).toBe(0)
})

test('edits, presets, algorithm changes and view switches preserve input and cancel old timers', () => {
  vi.useFakeTimers();const view=mount();apply('-2,0,2');click('Play');tick(1000);compare();tick(5000)
  expect(screen.getByLabelText('Shared original input')).toHaveTextContent('[-2, 0, 2]')
  expect(panels().every(p=>p.getAttribute('data-step')==='0')).toBe(true)
  click('Play');tick(1000);const before=state();apply('2,,3');tick(5000)
  expect(screen.getByRole('alert')).toHaveTextContent('current array is preserved');expect(state()).toEqual(before)
  click('Play');change('Algorithm 2','selection');tick(5000);expect(panels().every(p=>p.getAttribute('data-step')==='0')).toBe(true)
  click('Play');apply('3,1,2');tick(5000);expect(panels().every(p=>p.getAttribute('data-step')==='0')).toBe(true)
  for(const preset of ['Already sorted','Reverse sorted','Nearly sorted','Duplicates','Default example']) { click('Play');click(preset);tick(5000);expect(vi.getTimerCount()).toBe(0) }
  expect(screen.getByLabelText('Comma-separated integers')).toHaveValue('5, 1, 4, 2, 8')
  change('Random array length','3');click('Generate Random Array')
  const input=(screen.getByLabelText('Comma-separated integers') as HTMLInputElement).value
  expect(panels()[0].querySelector('[aria-label="Current array"]')!.textContent).toBe(panels()[1].querySelector('[aria-label="Current array"]')!.textContent)
  click('Play');fireEvent.click(screen.getByRole('tab',{name:'Visualize'}));tick(5000)
  expect(screen.getByLabelText('Comma-separated integers')).toHaveValue(input)
  expect(screen.getByRole('button',{name:'Previous Step'})).toBeDisabled()
  click('Play');view.unmount();expect(vi.getTimerCount()).toBe(0)
})

test('keyboard tabs use roving focus and both control targets exist', () => {
  mount();const visualize=screen.getByRole('tab',{name:'Visualize'})
  fireEvent.keyDown(visualize,{key:'ArrowRight'})
  const compareTab=screen.getByRole('tab',{name:'Compare'})
  expect(compareTab).toHaveFocus();expect(compareTab).toHaveAttribute('aria-selected','true')
  expect(document.getElementById(visualize.getAttribute('aria-controls')!)).toBeInTheDocument()
  expect(document.getElementById(compareTab.getAttribute('aria-controls')!)).toBeInTheDocument()
  fireEvent.keyDown(compareTab,{key:'Home'});expect(visualize).toHaveFocus()
  expect(screen.getByRole('heading',{name:algorithms.bubble.title,level:1})).toBeVisible()
})

test('summary only appears after every trace finishes, and never advertises timing rankings', () => {
  mount();compare();apply('1,2,3');const short=algorithms.bubble.createTrace([1,2,3]).length
  for(let i=1;i<short;i++)click('Next Step')
  expect(within(panels()[0]).getByText('Complete',{exact:true})).toBeVisible()
  expect(screen.queryByRole('table')).not.toBeInTheDocument()
  finish();expect(screen.getByRole('table')).toHaveTextContent('Trace steps')
  expect(screen.getByText(/no single counter establishes/)).toBeVisible()
})


test('autoplay keeps comparison explanations accessible without announcing every tick', () => {
  vi.useFakeTimers(); mount(); compare()
  expect(screen.getAllByRole('status').every(s => s.getAttribute('aria-live') === 'polite')).toBe(true)
  click('Play'); tick(1000)
  expect(screen.getAllByRole('status').every(s => s.getAttribute('aria-live') === 'off')).toBe(true)
  expect(screen.getByText('Playing. Pause to inspect the current step.')).toBeVisible()
  click('Pause')
  expect(screen.getAllByRole('status').every(s => s.getAttribute('aria-live') === 'polite')).toBe(true)
  expect(screen.getByRole('progressbar', { name: 'Execution progress' })).toHaveAttribute('aria-valuetext', expect.stringContaining('Paused. Step 2'))
})
