import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { expect, test } from 'vitest'
import SortingPage from './SortingPage'
import ArrayBars from './ArrayBars'
import { createBubbleSortTrace } from './bubbleSortTrace'

function displayedValues() {
  return within(screen.getByRole('list', { name: 'Current array' }))
    .getAllByRole('listitem').map((bar) => Number(bar.getAttribute('data-value')))
}

test('Next and Previous restore every array, explanation, highlight, and pseudocode step', () => {
  const trace = createBubbleSortTrace([5, 1, 4, 2, 8])
  render(<MemoryRouter><SortingPage /></MemoryRouter>)
  const previous = screen.getByRole('button', { name: 'Previous Step' })
  const next = screen.getByRole('button', { name: 'Next Step' })

  function assertStep(index: number) {
    const step = trace[index]
    expect(displayedValues()).toEqual(step.values)
    expect(screen.getByRole('status')).toHaveTextContent(step.explanation)
    expect(document.querySelector('.step-counter')).toHaveTextContent(`Step ${index + 1} of ${trace.length}`)
    const activeLines = document.querySelectorAll('.pseudocode-lines [aria-current="step"]')
    expect(activeLines).toHaveLength(1)
    expect(activeLines[0]).toHaveAttribute('data-line-id', step.lineId)
    const bars = within(screen.getByRole('list', { name: 'Current array' })).getAllByRole('listitem')
    bars.forEach((bar, position) => {
      let expected = position >= step.sortedFrom ? 'Sorted' : 'Ready'
      if (step.index !== null && (position === step.index || position === step.index + 1)) {
        expected = step.kind === 'swap' ? 'Swap' : 'Compare'
      }
      expect(bar).toHaveAttribute('data-state', expected)
      expect(bar).toHaveAccessibleName(`Index ${position}, value ${step.values[position]}, ${expected}`)
    })
  }

  expect(previous).toBeDisabled()
  fireEvent.click(previous)
  assertStep(0)
  for (let index = 1; index < trace.length; index += 1) {
    fireEvent.click(next)
    assertStep(index)
  }
  expect(next).toBeDisabled()
  expect(displayedValues()).toEqual([1, 2, 4, 5, 8])
  fireEvent.click(next)
  assertStep(trace.length - 1)
  for (let index = trace.length - 2; index >= 0; index -= 1) {
    fireEvent.click(previous)
    assertStep(index)
  }
  expect(previous).toBeDisabled()
})

test('queued clicks advance one step each without losing updates', () => {
  render(<MemoryRouter><SortingPage /></MemoryRouter>)
  const next = screen.getByRole('button', { name: 'Next Step' })
  act(() => {
    for (let index = 0; index < 5; index += 1) fireEvent.click(next)
  })
  expect(document.querySelector('.step-counter')).toHaveTextContent('Step 6 of')
  expect(displayedValues()).toEqual([1, 5, 4, 2, 8])
  expect(screen.getByRole('status')).toHaveTextContent('Swap 5 and 1')
})

test('renders negative and zero values accessibly and handles empty arrays', () => {
  const { rerender } = render(<ArrayBars values={[-3, 0, 2]} states={['Ready', 'Ready', 'Ready']} />)
  expect(displayedValues()).toEqual([-3, 0, 2])
  expect(screen.getByRole('listitem', { name: 'Index 0, value -3, Ready' })).toBeVisible()
  rerender(<ArrayBars values={[]} states={[]} />)
  expect(screen.getByText('The array is empty.')).toBeVisible()
})
