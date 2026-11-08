import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import SortingPage from './SortingPage'
import { createQuickSortTrace, type QuickSortStep } from './quickSortTrace'

beforeEach(() => vi.useFakeTimers())
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers() })
function select(value: string) { fireEvent.change(screen.getByLabelText('Algorithm'), { target: { value } }) }
function renderLesson() {
  const result = render(<MemoryRouter><SortingPage /></MemoryRouter>)
  select('quick')
  return result
}
function click(name: string) { fireEvent.click(screen.getByRole('button', { name })) }
function apply(value: string) {
  fireEvent.change(screen.getByLabelText('Comma-separated integers'), { target: { value } })
  click('Apply Array')
}
function tick(ms: number) { act(() => vi.advanceTimersByTime(ms)) }
function bars() { return within(screen.getByRole('list', { name: 'Current array' })).getAllByRole('listitem') }
function values() { return bars().map((bar) => Number(bar.getAttribute('data-value'))) }
function assertStep(step: QuickSortStep, index: number, total: number) {
  expect(values()).toEqual(step.values)
  expect(screen.getByRole('status')).toHaveTextContent(step.explanation)
  expect(document.querySelector('.step-counter')).toHaveTextContent(`Step ${index + 1} of ${total}`)
  const lines = document.querySelectorAll('.pseudocode-lines [aria-current="step"]')
  expect(lines).toHaveLength(1)
  expect(lines[0]).toHaveAttribute('data-line-id', step.lineId)
  expect(document.querySelector('[data-pivot-value]')).toHaveAttribute('data-pivot-value', step.pivotValue === null ? '' : String(step.pivotValue))
  const stack = Array.from(document.querySelectorAll('.quick-stack li'))
  expect(stack.map((call) => call.getAttribute('data-call-id'))).toEqual(step.stack)
  expect(stack.filter((call) => call.getAttribute('data-active') === 'true')).toHaveLength(step.stack.length ? 1 : 0)
  stack.forEach((call, position) => {
    const saved = step.calls.find((entry) => entry.id === step.stack[position])!
    expect(call).toHaveAttribute('data-status', saved.status)
    expect(call).toHaveTextContent(`[${saved.low}, ${saved.high}]`)
  })
  bars().forEach((bar, position) => {
    const state = bar.getAttribute('data-state')
    if (step.finalIndices.includes(position)) expect(['Sorted', 'Pivot placed']).toContain(state)
    else expect(['Sorted', 'Pivot placed']).not.toContain(state)
    if (step.swapIndices?.includes(position)) expect(state).toBe('Swap')
    else if (position === step.pivotIndex && !step.finalIndices.includes(position)) expect(state).toBe('Pivot')
  })
}

test('every forward and backward step restores pivot, partition, recursion, explanations, and code', () => {
  renderLesson()
  apply('4, 1, 3, 2')
  const trace = createQuickSortTrace([4, 1, 3, 2])
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Quick Sort')
  expect(screen.getByRole('button', { name: 'Previous Step' })).toBeDisabled()
  assertStep(trace[0], 0, trace.length)
  for (let index = 1; index < trace.length; index += 1) { click('Next Step'); assertStep(trace[index], index, trace.length) }
  expect(screen.getByRole('button', { name: 'Next Step' })).toBeDisabled()
  for (let index = trace.length - 2; index >= 0; index -= 1) { click('Previous Step'); assertStep(trace[index], index, trace.length) }
})

test('pending boundary, independent i/j labels, and final pivot are explained without claiming the sides are sorted', () => {
  renderLesson()
  apply('4, 1, 3, 2')
  const trace = createQuickSortTrace([4, 1, 3, 2])
  const boundary = trace.findIndex((step) => step.kind === 'boundary')
  for (let index = 0; index < boundary; index += 1) click('Next Step')
  expect(screen.getByText(/Swap pending: this slot is not classified/)).toBeVisible()
  expect(bars()[0]).toHaveAccessibleName('Index 0, value 4, Boundary, low · i')
  expect(bars()[1]).toHaveAccessibleName('Index 1, value 1, Scan, j')
  expect(bars()[2]).toHaveAttribute('data-state', 'Unseen')
  expect(bars()[3]).toHaveAccessibleName('Index 3, value 2, Pivot, high')
  const placement = trace.findIndex((step) => step.kind === 'pivot-fixed')
  for (let index = boundary; index < placement; index += 1) click('Next Step')
  expect(values()).toEqual([1, 2, 3, 4])
  expect(bars().map((bar) => bar.getAttribute('data-state'))).toEqual(['≤ pivot', 'Pivot placed', '> pivot', '> pivot'])
  expect(screen.getByRole('region', { name: 'Pivot and partition' })).toHaveTextContent('Value 2 at index 1 · Final position')
})

test.each(['bubble', 'selection', 'insertion', 'merge'])('switching between Quick Sort and %s during playback preserves original custom input', (other) => {
  renderLesson()
  apply('3, -2, 3, 0')
  const trace = createQuickSortTrace([3, -2, 3, 0])
  const firstSwap = trace.findIndex((step) => step.kind === 'swap')
  for (let index = 0; index < firstSwap; index += 1) click('Next Step')
  expect(values()).not.toEqual([3, -2, 3, 0])
  fireEvent.change(screen.getByLabelText('Speed'), { target: { value: '4' } })
  click('Play')
  select(other)
  expect(values()).toEqual([3, -2, 3, 0])
  expect(screen.queryByRole('region', { name: 'Pivot and partition' })).not.toBeInTheDocument()
  expect(document.querySelector('.quick-stack')).toBeNull()
  expect(vi.getTimerCount()).toBe(0)
  click('Play')
  tick(250)
  select('quick')
  tick(2000)
  expect(values()).toEqual([3, -2, 3, 0])
  expect(document.querySelector('.step-counter')).toHaveTextContent('Step 1 of')
  expect(screen.getByLabelText('Comma-separated integers')).toHaveValue('3, -2, 3, 0')
  expect(screen.getByLabelText('Speed')).toHaveValue('4')
  expect(document.querySelector('[data-pivot-value]')).toHaveAttribute('data-pivot-value', '')
  expect(screen.queryByRole('region', { name: 'Merge storage' })).not.toBeInTheDocument()
  expect(screen.queryByRole('region', { name: 'Held key' })).not.toBeInTheDocument()
  expect(vi.getTimerCount()).toBe(0)
})

test.each([[0.5, 2000], [1, 1000], [2, 500], [4, 250]])('Quick Sort respects speed %s and manual navigation', (speed, delay) => {
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

test('autoplay stays synchronized through completion and supports Replay, Reset, and cleanup', () => {
  const { unmount } = renderLesson()
  apply('2, -1, 2')
  const trace = createQuickSortTrace([2, -1, 2])
  fireEvent.change(screen.getByLabelText('Speed'), { target: { value: '4' } })
  click('Play')
  for (let index = 1; index < trace.length; index += 1) { tick(250); assertStep(trace[index], index, trace.length) }
  expect(vi.getTimerCount()).toBe(0)
  expect(screen.getByRole('progressbar')).toHaveAttribute('value', '100')
  click('Replay')
  expect(values()).toEqual([2, -1, 2])
  expect(document.querySelector('.quick-stack')).toBeNull()
  tick(250)
  click('Reset')
  expect(document.querySelector('.step-counter')).toHaveTextContent('Step 1 of')
  expect(screen.getByLabelText('Speed')).toHaveValue('4')
  expect(vi.getTimerCount()).toBe(0)
  click('Play')
  unmount()
  expect(vi.getTimerCount()).toBe(0)
})

test('invalid input preserves the active partition; random and valid inputs reset all recursive state', () => {
  renderLesson()
  apply('-2, 3, 0')
  const trace = createQuickSortTrace([-2, 3, 0])
  const pivot = trace.findIndex((step) => step.kind === 'pivot')
  for (let index = 0; index < pivot; index += 1) click('Next Step')
  expect(document.querySelector('[data-pivot-value]')).toHaveAttribute('data-pivot-value', '0')
  click('Play')
  apply('1, nope')
  expect(screen.getByRole('alert')).toBeVisible()
  assertStep(trace[pivot], pivot, trace.length)
  expect(vi.getTimerCount()).toBe(0)
  vi.spyOn(Math, 'random').mockReturnValue(0.5)
  fireEvent.change(screen.getByLabelText('Random array length'), { target: { value: '12' } })
  click('Generate Random Array')
  expect(values()).toEqual(Array(12).fill(0))
  expect(document.querySelector('.quick-stack')).toBeNull()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  click('Play')
  tick(1000)
  apply('-99')
  expect(vi.getTimerCount()).toBe(0)
  click('Play')
  for (let index = 1; index < createQuickSortTrace([-99]).length; index += 1) tick(1000)
  expect(screen.getByRole('button', { name: 'Replay' })).toBeVisible()
  expect(values()).toEqual([-99])
})
