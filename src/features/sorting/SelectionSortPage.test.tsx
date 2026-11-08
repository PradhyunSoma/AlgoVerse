import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import SortingPage from './SortingPage'
import { createSelectionSortTrace } from './selectionSortTrace'

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

function renderLesson() {
  return render(<MemoryRouter><SortingPage /></MemoryRouter>)
}
function select(algorithm: 'bubble' | 'selection') {
  fireEvent.change(screen.getByLabelText('Algorithm'), { target: { value: algorithm } })
}
function click(name: string) {
  fireEvent.click(screen.getByRole('button', { name }))
}
function apply(text: string) {
  fireEvent.change(screen.getByLabelText('Comma-separated integers'), { target: { value: text } })
  click('Apply Array')
}
function values() {
  return within(screen.getByRole('list', { name: 'Current array' }))
    .getAllByRole('listitem').map((bar) => Number(bar.getAttribute('data-value')))
}
function tick(ms = 1000) {
  act(() => vi.advanceTimersByTime(ms))
}

test('every Selection step and previous snapshot match the bars, explanation, and code', () => {
  renderLesson()
  select('selection')
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Selection Sort')
  const trace = createSelectionSortTrace([5, 1, 4, 2, 8])
  function assertStep(index: number) {
    const step = trace[index]
    expect(values()).toEqual(step.values)
    expect(screen.getByRole('status')).toHaveTextContent(step.explanation)
    expect(document.querySelector('.step-counter')).toHaveTextContent(`Step ${index + 1} of ${trace.length}`)
    const lines = document.querySelectorAll('.pseudocode-lines [aria-current="step"]')
    expect(lines).toHaveLength(1)
    expect(lines[0]).toHaveAttribute('data-line-id', step.lineId)
    const bars = within(screen.getByRole('list', { name: 'Current array' })).getAllByRole('listitem')
    bars.forEach((bar, position) => {
      let state = position < step.sortedCount ? 'Sorted' : 'Ready'
      if (position === step.scanIndex) state = 'Scan'
      if (position === step.minimumIndex) state = position === step.scanIndex ? 'Scan + min' : 'Minimum'
      if (step.swapIndices?.includes(position)) state = 'Swap'
      expect(bar).toHaveAttribute('data-state', state)
      expect(bar).toHaveAccessibleName(`Index ${position}, value ${step.values[position]}, ${state}`)
    })
  }
  assertStep(0)
  expect(screen.getByRole('button', { name: 'Previous Step' })).toBeDisabled()
  for (let index = 1; index < trace.length; index += 1) {
    click('Next Step')
    assertStep(index)
  }
  expect(screen.getByRole('button', { name: 'Next Step' })).toBeDisabled()
  for (let index = trace.length - 2; index >= 0; index -= 1) {
    click('Previous Step')
    assertStep(index)
  }
})

test('switching during playback preserves the original custom input and selected speed in both directions', () => {
  renderLesson()
  apply('3, -2, 3, 0')
  for (let index = 0; index < 5; index += 1) click('Next Step')
  expect(values()).toEqual([-2, 3, 3, 0])
  fireEvent.change(screen.getByLabelText('Speed'), { target: { value: '4' } })
  click('Play')
  select('selection')
  expect(vi.getTimerCount()).toBe(0)
  expect(values()).toEqual([3, -2, 3, 0])
  expect(screen.getByLabelText('Comma-separated integers')).toHaveValue('3, -2, 3, 0')
  expect(screen.getByLabelText('Speed')).toHaveValue('4')
  tick(5000)
  expect(document.querySelector('.step-counter')).toHaveTextContent('Step 1 of')
  click('Play')
  const swap = createSelectionSortTrace([3, -2, 3, 0]).findIndex((step) => step.kind === 'swap')
  for (let index = 0; index < swap; index += 1) tick(250)
  expect(values()).toEqual([-2, 3, 3, 0])
  select('bubble')
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Bubble Sort')
  expect(values()).toEqual([3, -2, 3, 0])
  expect(document.querySelector('.pseudocode-lines [aria-current]')).toHaveAttribute('data-line-id', 'start')
  expect(vi.getTimerCount()).toBe(0)
})

test('Selection autoplay supports speed changes, pause, manual steps, completion, replay, and reset', () => {
  const { unmount } = renderLesson()
  select('selection')
  apply('2, -1, 2')
  const trace = createSelectionSortTrace([2, -1, 2])
  click('Play')
  tick(999)
  expect(document.querySelector('.step-counter')).toHaveTextContent('Step 1 of')
  tick(1)
  click('Pause')
  tick(5000)
  expect(document.querySelector('.step-counter')).toHaveTextContent('Step 2 of')
  click('Next Step')
  click('Previous Step')
  click('Play')
  fireEvent.change(screen.getByLabelText('Speed'), { target: { value: '4' } })
  for (let index = 2; index < trace.length; index += 1) {
    tick(250)
    expect(values()).toEqual(trace[index].values)
    expect(screen.getByRole('status')).toHaveTextContent(trace[index].explanation)
    expect(document.querySelector('.pseudocode-lines [aria-current]')).toHaveAttribute('data-line-id', trace[index].lineId)
  }
  expect(vi.getTimerCount()).toBe(0)
  expect(screen.getByRole('progressbar')).toHaveAttribute('value', '100')
  click('Replay')
  expect(values()).toEqual([2, -1, 2])
  tick(250)
  click('Reset')
  expect(vi.getTimerCount()).toBe(0)
  expect(document.querySelector('.step-counter')).toHaveTextContent('Step 1 of')
  expect(screen.getByLabelText('Speed')).toHaveValue('4')
  click('Play')
  unmount()
  expect(vi.getTimerCount()).toBe(0)
})

test('Selection accepts new and random inputs; switching uses the last valid array even with an invalid draft', () => {
  renderLesson()
  select('selection')
  apply('-5, 0, -5')
  click('Play')
  tick()
  apply('3, nope')
  expect(screen.getByRole('alert')).toBeVisible()
  expect(values()).toEqual([-5, 0, -5])
  select('bubble')
  select('selection')
  expect(values()).toEqual([-5, 0, -5])
  expect(document.querySelector('.step-counter')).toHaveTextContent('Step 1 of')
  vi.spyOn(Math, 'random').mockReturnValue(0.5)
  fireEvent.change(screen.getByLabelText('Random array length'), { target: { value: '4' } })
  click('Generate Random Array')
  expect(values()).toEqual([0, 0, 0, 0])
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  click('Play')
  tick()
  apply('-99')
  expect(vi.getTimerCount()).toBe(0)
  expect(document.querySelector('.step-counter')).toHaveTextContent('Step 1 of 2')
  click('Play')
  tick()
  expect(screen.getByRole('button', { name: 'Replay' })).toBeVisible()
})
