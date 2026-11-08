import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from '../app/App'
import { sortingComplexity } from '../features/sorting/complexity'
import { listComplexity } from '../features/linked-lists/complexity'
import { treeComplexity } from '../features/trees/complexity'
import { graphComplexity } from '../features/graphs/complexity'
import type { ComplexityProfile } from './complexity'

beforeEach(() => {
  // jsdom does not implement scrolling; the browser check covers real layout.
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
})
afterEach(() => { cleanup(); vi.restoreAllMocks() })
function verify(profile: ComplexityProfile) {
  const panel = screen.getByRole('region', { name: `${profile.name} complexity` })
  expect(within(panel).getByRole('heading', { name: 'Time and space complexity' })).toBeVisible()
  for (const { label, bound } of profile.rows) {
    const term = within(panel).getByText(label, { exact: true })
    expect(term.nextElementSibling).toHaveTextContent(bound)
  }
  expect(panel).toHaveTextContent(profile.variables)
  expect(panel).toHaveTextContent(profile.why)
  expect(panel).toHaveTextContent('Growth rates, not measurements.')
  expect(panel).toHaveTextContent('they are not operation counts or runtime benchmarks')
  const summary = within(panel).getByText('Implementation assumptions and storage')
  expect(summary.closest('details')).not.toHaveAttribute('open')
  fireEvent.click(summary)
  expect(summary.closest('details')).toHaveAttribute('open')
  for (const text of [...profile.assumptions, ...profile.storage]) expect(within(panel).getByText(text, { exact: true })).toBeVisible()
  fireEvent.click(summary)
  expect(summary.closest('details')).not.toHaveAttribute('open')
}

const pages = [
  { path: '/sorting', selector: 'Algorithm', catalog: sortingComplexity },
  { path: '/linked-lists', selector: 'List type', catalog: listComplexity },
  { path: '/trees', selector: 'Tree type', catalog: treeComplexity },
  { path: '/graphs', selector: 'Algorithm', catalog: graphComplexity },
]
for (const { path, selector, catalog } of pages) {
  test(`${path} shows the matching complexity lesson for every implemented mode`, () => {
    render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>)
    for (const [mode, profile] of Object.entries(catalog)) {
      fireEvent.change(screen.getByLabelText(selector), { target: { value: mode } })
      expect(screen.getAllByRole('heading', { name: 'Time and space complexity' })).toHaveLength(1)
      verify(profile)
    }
  })
}

test('the lesson remains available without changing playback state', () => {
  render(<MemoryRouter initialEntries={['/sorting']}><App /></MemoryRouter>)
  fireEvent.click(screen.getByRole('button', { name: 'Next Step' }))
  const explanation = screen.getByRole('status').textContent
  const line = document.querySelector('[aria-current="step"]')?.getAttribute('data-line-id')
  verify(sortingComplexity.bubble)
  expect(screen.getByRole('status')).toHaveTextContent(explanation!)
  expect(document.querySelector('[aria-current="step"]')).toHaveAttribute('data-line-id', line)
})
