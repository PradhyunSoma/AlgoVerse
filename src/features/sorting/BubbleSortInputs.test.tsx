import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import SortingPage from './SortingPage'
import { createBubbleSortTrace } from './bubbleSortTrace'

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

function renderLesson() {
  return render(<MemoryRouter><SortingPage /></MemoryRouter>)
}
function values() {
  return within(screen.getByRole('list', { name: 'Current array' }))
    .getAllByRole('listitem').map((bar) => Number(bar.getAttribute('data-value')))
}
function apply(text: string) {
  fireEvent.change(screen.getByLabelText('Comma-separated integers'), { target: { value: text } })
  fireEvent.click(screen.getByRole('button', { name: 'Apply Array' }))
}
function tick(milliseconds: number) {
  act(() => vi.advanceTimersByTime(milliseconds))
}

test('valid custom input pauses and resets a running trace, including same-size replacements', () => {
  renderLesson()
  fireEvent.click(screen.getByRole('button', { name: 'Play' }))
  tick(1000)
  apply(' 5, 1, 4, 2, 8 ')
  expect(document.querySelector('.step-counter')).toHaveTextContent('Step 1 of 42')
  expect(screen.getByRole('button', { name: 'Play' })).toBeVisible()
  expect(vi.getTimerCount()).toBe(0)
  apply('-3, 0, -3, 9')
  expect(values()).toEqual([-3, 0, -3, 9])
  expect(screen.getByRole('button', { name: 'Previous Step' })).toBeDisabled()
  tick(5000)
  expect(values()).toEqual([-3, 0, -3, 9])
  expect(document.querySelector('.pseudocode-lines [aria-current]')).toHaveAttribute('data-line-id', 'start')
  expect(screen.getByRole('status')).toHaveTextContent('Start with 4 values')
  expect(screen.getByRole('progressbar', { name: 'Execution progress' })).toHaveAttribute('value', '0')
})

test('invalid submission preserves the current snapshot and pauses autoplay', () => {
  renderLesson()
  for (let index = 0; index < 5; index += 1) fireEvent.click(screen.getByRole('button', { name: 'Next Step' }))
  fireEvent.click(screen.getByRole('button', { name: 'Play' }))
  apply('1, nope, 3')
  expect(screen.getByRole('alert')).toHaveTextContent('Value 2 must be an integer')
  expect(screen.getByLabelText('Comma-separated integers')).toHaveAttribute('aria-invalid', 'true')
  expect(values()).toEqual([1, 5, 4, 2, 8])
  expect(document.querySelector('.step-counter')).toHaveTextContent('Step 6 of 42')
  expect(document.querySelector('.pseudocode-lines [aria-current]')).toHaveAttribute('data-line-id', 'swap')
  tick(5000)
  expect(document.querySelector('.step-counter')).toHaveTextContent('Step 6 of 42')
  expect(vi.getTimerCount()).toBe(0)
  apply('3, 2, 1')
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  expect(values()).toEqual([3, 2, 1])
})

test('random generation applies the selected length, clears errors, and replaces the draft', () => {
  renderLesson()
  vi.spyOn(Math, 'random').mockReturnValue(0.5)
  apply('invalid')
  fireEvent.change(screen.getByLabelText('Random array length'), { target: { value: '12' } })
  fireEvent.click(screen.getByRole('button', { name: 'Generate Random Array' }))
  expect(values()).toEqual(Array(12).fill(0))
  expect(screen.getByLabelText('Comma-separated integers')).toHaveValue(Array(12).fill(0).join(', '))
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Play' }))
  tick(1000)
  fireEvent.click(screen.getByRole('button', { name: 'Generate Random Array' }))
  expect(document.querySelector('.step-counter')).toHaveTextContent('Step 1 of')
  expect(vi.getTimerCount()).toBe(0)
})

test('autoplay stays synchronized through completion and supports Replay, speed, Pause, and Reset', () => {
  renderLesson()
  apply('2, -1, 2')
  const trace = createBubbleSortTrace([2, -1, 2])
  fireEvent.change(screen.getByLabelText('Speed'), { target: { value: '4' } })
  fireEvent.click(screen.getByRole('button', { name: 'Play' }))
  for (let index = 1; index < trace.length; index += 1) {
    tick(250)
    expect(values()).toEqual(trace[index].values)
    expect(screen.getByRole('status')).toHaveTextContent(trace[index].explanation)
    expect(document.querySelector('.pseudocode-lines [aria-current]')).toHaveAttribute('data-line-id', trace[index].lineId)
    expect(document.querySelector('.step-counter')).toHaveTextContent(`Step ${index + 1} of ${trace.length}`)
  }
  expect(screen.getByRole('progressbar', { name: 'Execution progress' })).toHaveAttribute('value', '100')
  expect(screen.getByRole('button', { name: 'Next Step' })).toBeDisabled()
  expect(vi.getTimerCount()).toBe(0)
  fireEvent.click(screen.getByRole('button', { name: 'Replay' }))
  expect(values()).toEqual([2, -1, 2])
  tick(250)
  fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
  tick(1000)
  expect(document.querySelector('.step-counter')).toHaveTextContent('Step 2 of')
  fireEvent.click(screen.getByRole('button', { name: 'Next Step' }))
  expect(document.querySelector('.step-counter')).toHaveTextContent('Step 3 of')
  fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
  expect(document.querySelector('.step-counter')).toHaveTextContent('Step 1 of')
  expect(screen.getByLabelText('Speed')).toHaveValue('4')
})

test('handles one-element input and cancels a running lesson on unmount', () => {
  const { unmount } = renderLesson()
  apply('-99')
  expect(values()).toEqual([-99])
  fireEvent.click(screen.getByRole('button', { name: 'Play' }))
  tick(1000)
  expect(screen.getByRole('button', { name: 'Replay' })).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Replay' }))
  expect(vi.getTimerCount()).toBe(1)
  unmount()
  expect(vi.getTimerCount()).toBe(0)
})
