import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import SortingPage from './SortingPage'
import { createMergeSortTrace, type MergeSortStep } from './mergeSortTrace'

beforeEach(() => vi.useFakeTimers())
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers() })
function select(value: string) { fireEvent.change(screen.getByLabelText('Algorithm'), { target: { value } }) }
function renderLesson() {
  const result = render(<MemoryRouter><SortingPage /></MemoryRouter>)
  select('merge')
  return result
}
function click(name: string) { fireEvent.click(screen.getByRole('button', { name })) }
function apply(value: string) {
  fireEvent.change(screen.getByLabelText('Comma-separated integers'), { target: { value } })
  click('Apply Array')
}
function tick(ms: number) { act(() => vi.advanceTimersByTime(ms)) }
function values() {
  return within(screen.getByRole('list', { name: 'Current array' })).getAllByRole('listitem')
    .map((bar) => Number(bar.getAttribute('data-value')))
}
function assertStep(step: MergeSortStep, index: number, total: number) {
  expect(values()).toEqual(step.values)
  expect(screen.getByRole('status')).toHaveTextContent(step.explanation)
  expect(document.querySelector('.step-counter')).toHaveTextContent(`Step ${index + 1} of ${total}`)
  const activeLines = document.querySelectorAll('.pseudocode-lines [aria-current="step"]')
  expect(activeLines).toHaveLength(1)
  expect(activeLines[0]).toHaveAttribute('data-line-id', step.lineId)
  const nodes = Array.from(document.querySelectorAll('.merge-node'))
  expect(nodes.map((node) => node.getAttribute('data-node-id'))).toEqual(step.nodes.map((node) => node.id))
  nodes.forEach((node, position) => {
    const saved = step.nodes[position]
    expect(node).toHaveAttribute('data-status', saved.status)
    expect(node).toHaveTextContent(`In [${saved.input.join(', ')}]`)
    expect(node).toHaveTextContent(saved.result === null ? 'Out —' : `Out [${saved.result.join(', ')}]`)
  })
  const active = nodes.filter((node) => node.getAttribute('data-active') === 'true')
  expect(active).toHaveLength(step.kind === 'start' || step.kind === 'complete' ? 0 : 1)
  if (active.length) expect(active[0]).toHaveAttribute('data-node-id', step.nodeId)
  if (step.sourceValues === null) {
    expect(screen.queryByRole('region', { name: 'Merge storage' })).not.toBeInTheDocument()
  } else {
    const buffer = within(screen.getByRole('list', { name: 'Temporary merge buffer' })).getAllByRole('listitem')
    expect(buffer.map((cell) => cell.getAttribute('data-value') === '' ? null : Number(cell.getAttribute('data-value')))).toEqual(step.buffer)
    const left = within(screen.getByRole('list', { name: 'Left merge source' })).getAllByRole('listitem')
    const right = within(screen.getByRole('list', { name: 'Right merge source' })).getAllByRole('listitem')
    ;[...left, ...right].forEach((cell, position) => {
      const sourceIndex = step.lo + position
      const state = sourceIndex === step.sourceIndex ? 'Selected'
        : step.kind === 'compare' && (sourceIndex === step.leftIndex || sourceIndex === step.rightIndex) ? 'Compare'
          : sourceIndex < step.mid! ? 'Left' : 'Right'
      expect(cell).toHaveAccessibleName(`Index ${sourceIndex}, value ${step.sourceValues![position]}, ${state}`)
    })
  }
}

test('Next and Previous restore every recursive call, buffer, explanation, and code highlight', () => {
  renderLesson()
  apply('3, 1, 2')
  const trace = createMergeSortTrace([3, 1, 2])
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Merge Sort')
  assertStep(trace[0], 0, trace.length)
  expect(screen.getByRole('button', { name: 'Previous Step' })).toBeDisabled()
  for (let index = 1; index < trace.length; index += 1) {
    click('Next Step')
    assertStep(trace[index], index, trace.length)
  }
  expect(screen.getByRole('button', { name: 'Next Step' })).toBeDisabled()
  for (let index = trace.length - 2; index >= 0; index -= 1) {
    click('Previous Step')
    assertStep(trace[index], index, trace.length)
  }
})

test('copy-back is explicitly identified and retains immutable source and full buffer views', () => {
  renderLesson()
  apply('2, 1')
  const trace = createMergeSortTrace([2, 1])
  const copyIndex = trace.findIndex((step) => step.kind === 'copy')
  for (let index = 0; index < copyIndex; index += 1) click('Next Step')
  expect(values()).toEqual([1, 1])
  expect(screen.getByText(/Copy-back in progress. The working array can temporarily contain repeated values/)).toBeVisible()
  expect(screen.getByRole('listitem', { name: 'Buffer index 0, value 1, Destination' })).toBeVisible()
  expect(screen.getByRole('listitem', { name: 'Buffer index 1, value 2, Written' })).toBeVisible()
  expect(within(screen.getByRole('list', { name: 'Left merge source' })).getByRole('listitem')).toHaveAccessibleName('Index 0, value 2, Left')
  expect(document.querySelector('.array-column[data-state="Merged"]')).toBeNull()
  click('Previous Step')
  expect(values()).toEqual([2, 1])
})

test.each(['bubble', 'selection', 'insertion'])('switching between Merge and %s during playback preserves original input', (other) => {
  renderLesson()
  apply('2, -1, 2')
  fireEvent.change(screen.getByLabelText('Speed'), { target: { value: '4' } })
  const trace = createMergeSortTrace([2, -1, 2])
  const copyIndex = trace.findIndex((step) => step.kind === 'copy' && step.nodeId === 'root')
  for (let index = 0; index < copyIndex; index += 1) click('Next Step')
  click('Play')
  select(other)
  expect(values()).toEqual([2, -1, 2])
  expect(screen.queryByRole('region', { name: 'Merge storage' })).not.toBeInTheDocument()
  expect(vi.getTimerCount()).toBe(0)
  click('Play')
  tick(250)
  select('merge')
  tick(2000)
  expect(values()).toEqual([2, -1, 2])
  expect(document.querySelector('.step-counter')).toHaveTextContent('Step 1 of')
  expect(document.querySelectorAll('.merge-node')).toHaveLength(0)
  expect(screen.getByLabelText('Comma-separated integers')).toHaveValue('2, -1, 2')
  expect(screen.getByLabelText('Speed')).toHaveValue('4')
  expect(vi.getTimerCount()).toBe(0)
})

test.each([[0.5, 2000], [1, 1000], [2, 500], [4, 250]])('Merge respects speed %s and pauses for manual navigation', (speed, delay) => {
  renderLesson()
  click('Play')
  fireEvent.change(screen.getByLabelText('Speed'), { target: { value: String(speed) } })
  tick(delay - 1)
  expect(document.querySelector('.step-counter')).toHaveTextContent('Step 1 of')
  tick(1)
  expect(document.querySelector('.step-counter')).toHaveTextContent('Step 2 of')
  click('Pause')
  tick(delay * 2)
  expect(document.querySelector('.step-counter')).toHaveTextContent('Step 2 of')
  click('Next Step')
  expect(document.querySelector('.step-counter')).toHaveTextContent('Step 3 of')
  click('Previous Step')
  expect(document.querySelector('.step-counter')).toHaveTextContent('Step 2 of')
})

test('Merge autoplay stays synchronized and supports completion, replay, reset, and timer cleanup', () => {
  const { unmount } = renderLesson()
  apply('2, -1, 2')
  const trace = createMergeSortTrace([2, -1, 2])
  fireEvent.change(screen.getByLabelText('Speed'), { target: { value: '4' } })
  click('Play')
  for (let index = 1; index < trace.length; index += 1) {
    tick(250)
    assertStep(trace[index], index, trace.length)
  }
  expect(vi.getTimerCount()).toBe(0)
  expect(screen.getByRole('progressbar')).toHaveAttribute('value', '100')
  click('Replay')
  expect(values()).toEqual([2, -1, 2])
  expect(document.querySelectorAll('.merge-node')).toHaveLength(0)
  tick(250)
  click('Reset')
  expect(document.querySelector('.step-counter')).toHaveTextContent('Step 1 of')
  expect(screen.getByLabelText('Speed')).toHaveValue('4')
  expect(vi.getTimerCount()).toBe(0)
  click('Play')
  unmount()
  expect(vi.getTimerCount()).toBe(0)
})

test('invalid input preserves an active merge; random and valid inputs clear recursive state', () => {
  renderLesson()
  apply('2, 1')
  const trace = createMergeSortTrace([2, 1])
  const copyIndex = trace.findIndex((step) => step.kind === 'copy')
  for (let index = 0; index < copyIndex; index += 1) click('Next Step')
  click('Play')
  apply('nope')
  expect(screen.getByRole('alert')).toBeVisible()
  assertStep(trace[copyIndex], copyIndex, trace.length)
  expect(vi.getTimerCount()).toBe(0)
  vi.spyOn(Math, 'random').mockReturnValue(0.5)
  fireEvent.change(screen.getByLabelText('Random array length'), { target: { value: '12' } })
  click('Generate Random Array')
  expect(values()).toEqual(Array(12).fill(0))
  expect(document.querySelectorAll('.merge-node')).toHaveLength(0)
  expect(screen.queryByRole('region', { name: 'Merge storage' })).not.toBeInTheDocument()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  click('Play')
  tick(1000)
  apply('-99')
  expect(vi.getTimerCount()).toBe(0)
  click('Play')
  for (let index = 1; index < createMergeSortTrace([-99]).length; index += 1) tick(1000)
  expect(screen.getByRole('button', { name: 'Replay' })).toBeVisible()
  expect(values()).toEqual([-99])
})
