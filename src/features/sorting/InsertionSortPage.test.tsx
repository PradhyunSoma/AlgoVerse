import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import SortingPage from './SortingPage'
import { createInsertionSortTrace } from './insertionSortTrace'

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.useRealTimers()
})
function select(value: string) {
  fireEvent.change(screen.getByLabelText('Algorithm'), { target: { value } })
}
function renderLesson() {
  const result = render(<MemoryRouter><SortingPage /></MemoryRouter>)
  select('insertion')
  return result
}
function click(name: string) { fireEvent.click(screen.getByRole('button', { name })) }
function apply(value: string) {
  fireEvent.change(screen.getByLabelText('Comma-separated integers'), { target: { value } })
  click('Apply Array')
}
function tick(ms: number) { act(() => vi.advanceTimersByTime(ms)) }
function bars() { return within(screen.getByRole('list', { name: 'Current array' })).getAllByRole('listitem') }
function values() { return bars().map((bar) => bar.getAttribute('data-value') === '' ? null : Number(bar.getAttribute('data-value'))) }
function heldKey() { return screen.getByRole('region', { name: 'Held key' }) }

test('all forward and backward steps restore the key, vacancy, highlights, explanations, and code', () => {
  renderLesson()
  apply('3, 4, 1, 1')
  const trace = createInsertionSortTrace([3, 4, 1, 1])
  function assertStep(index: number) {
    const step = trace[index]
    expect(values()).toEqual(step.values)
    expect(within(heldKey()).getByText(step.key === null ? '—' : String(step.key), { exact: true })).toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent(step.explanation)
    expect(document.querySelector('.step-counter')).toHaveTextContent(`Step ${index + 1} of ${trace.length}`)
    const lines = document.querySelectorAll('.pseudocode-lines [aria-current="step"]')
    expect(lines).toHaveLength(1)
    expect(lines[0]).toHaveAttribute('data-line-id', step.lineId)
    bars().forEach((bar, position) => {
      let state = position < step.sortedCount || (step.key !== null && position === step.outerIndex) ? 'Sorted' : 'Ready'
      if ((step.kind === 'compare' || step.kind === 'stop') && position === step.index) state = 'Compare'
      if (position === step.shiftedTo) state = 'Shift'
      if (position === step.insertedIndex) state = 'Key'
      if (position === step.vacantIndex) state = 'Vacant'
      expect(bar).toHaveAttribute('data-state', state)
      expect(bar).toHaveAccessibleName(position === step.vacantIndex
        ? `Index ${position}, vacant insertion position` : `Index ${position}, value ${step.values[position]}, ${state}`)
    })
  }
  assertStep(0)
  expect(bars()[0]).toHaveAttribute('data-state', 'Sorted')
  expect(screen.getByRole('button', { name: 'Previous Step' })).toBeDisabled()
  for (let index = 1; index < trace.length; index += 1) { click('Next Step'); assertStep(index) }
  expect(screen.getByRole('button', { name: 'Next Step' })).toBeDisabled()
  for (let index = trace.length - 2; index >= 0; index -= 1) { click('Previous Step'); assertStep(index) }
})

test('zero is a real held key, and lifting an extreme key does not rescale the remaining bars', () => {
  renderLesson()
  apply('4, -99')
  const initialStyle = bars()[0].querySelector('.array-bar')!.getAttribute('style')
  click('Next Step')
  click('Next Step')
  expect(values()).toEqual([4, null])
  expect(heldKey()).toHaveTextContent('Key -99 is held outside the array')
  expect(bars()[0].querySelector('.array-bar')).toHaveAttribute('style', initialStyle)
  expect(bars()[1].querySelector('.array-bar')).toBeNull()
  expect(bars()[1].querySelector('.vacant-slot')).not.toBeNull()
  apply('4, 0')
  click('Next Step')
  click('Next Step')
  expect(heldKey()).toHaveTextContent('Key 0 is held outside the array')
  expect(values()).toEqual([4, null])
})

test.each(['bubble', 'selection'])('switching to and from %s during autoplay preserves the full original input', (other) => {
  renderLesson()
  apply('3, -2, 3, 0')
  fireEvent.change(screen.getByLabelText('Speed'), { target: { value: '4' } })
  click('Play')
  for (let index = 0; index < 5; index += 1) tick(250)
  expect(values()).toEqual([null, 3, 3, 0])
  select(other)
  expect(values()).toEqual([3, -2, 3, 0])
  expect(screen.queryByRole('region', { name: 'Held key' })).not.toBeInTheDocument()
  expect(vi.getTimerCount()).toBe(0)
  click('Play')
  tick(250)
  select('insertion')
  expect(values()).toEqual([3, -2, 3, 0])
  expect(screen.getByLabelText('Comma-separated integers')).toHaveValue('3, -2, 3, 0')
  expect(screen.getByLabelText('Speed')).toHaveValue('4')
  tick(2000)
  expect(document.querySelector('.step-counter')).toHaveTextContent('Step 1 of')
  expect(heldKey()).toHaveTextContent('No key is held')
  expect(vi.getTimerCount()).toBe(0)
})

test.each([[0.5, 2000], [1, 1000], [2, 500], [4, 250]])('Insertion playback respects speed %s', (speed, delay) => {
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
  expect(heldKey()).toHaveTextContent('Key 1 is held outside the array')
  click('Previous Step')
  expect(heldKey()).toHaveTextContent('No key is held')
})

test('autoplay stays synchronized through completion, replay, reset, and cleanup', () => {
  const { unmount } = renderLesson()
  apply('2, -1, 2')
  const trace = createInsertionSortTrace([2, -1, 2])
  fireEvent.change(screen.getByLabelText('Speed'), { target: { value: '4' } })
  click('Play')
  for (let index = 1; index < trace.length; index += 1) {
    tick(250)
    expect(values()).toEqual(trace[index].values)
    expect(screen.getByRole('status')).toHaveTextContent(trace[index].explanation)
    expect(document.querySelector('[aria-current="step"]')).toHaveAttribute('data-line-id', trace[index].lineId)
  }
  expect(screen.getByRole('progressbar')).toHaveAttribute('value', '100')
  expect(vi.getTimerCount()).toBe(0)
  click('Replay')
  expect(values()).toEqual([2, -1, 2])
  tick(250)
  click('Reset')
  expect(document.querySelector('.step-counter')).toHaveTextContent('Step 1 of')
  expect(vi.getTimerCount()).toBe(0)
  expect(screen.getByLabelText('Speed')).toHaveValue('4')
  click('Play')
  unmount()
  expect(vi.getTimerCount()).toBe(0)
})

test('invalid input preserves a held key; random and valid input reset the whole snapshot', () => {
  renderLesson()
  apply('-5, -9, -5')
  click('Next Step')
  click('Next Step')
  click('Play')
  apply('1, nope')
  expect(screen.getByRole('alert')).toBeVisible()
  expect(values()).toEqual([-5, null, -5])
  expect(heldKey()).toHaveTextContent('Key -9 is held outside the array')
  expect(vi.getTimerCount()).toBe(0)
  vi.spyOn(Math, 'random').mockReturnValue(0.5)
  fireEvent.change(screen.getByLabelText('Random array length'), { target: { value: '12' } })
  click('Generate Random Array')
  expect(values()).toEqual(Array(12).fill(0))
  expect(heldKey()).toHaveTextContent('No key is held')
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  click('Play')
  tick(1000)
  apply('-99')
  expect(vi.getTimerCount()).toBe(0)
  expect(document.querySelector('.step-counter')).toHaveTextContent('Step 1 of 2')
  click('Play')
  tick(1000)
  expect(screen.getByRole('button', { name: 'Replay' })).toBeVisible()
})
