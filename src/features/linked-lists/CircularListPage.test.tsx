import { StrictMode } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import LinkedListPage from './LinkedListPage'
import { circularSummary, createCircularList } from './circularListModel'
import { createCircularTrace, type CircularStep } from './circularListTrace'
import type { ListOperation } from './listOperations'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
const fill = (name: string, value: string) => fireEvent.change(screen.getByLabelText(name), { target: { value } })
const tick = (ms = 1000) => act(() => vi.advanceTimersByTime(ms))
function renderPage() {
  const result = render(<StrictMode><MemoryRouter><LinkedListPage /></MemoryRouter></StrictMode>)
  fill('List type', 'circular')
  return result
}
function apply(operation: ListOperation) {
  fill('Operation', operation.kind)
  if ('value' in operation) fill('Value', String(operation.value))
  if ('position' in operation) fill('Position', String(operation.position))
  click('Apply Operation')
}
function finish() {
  let count = 0
  while (!(screen.getByRole('button', { name: /Next Step/ }) as HTMLButtonElement).disabled) {
    click('Next Step')
    if (++count > 100) throw new Error('Playback did not finish')
  }
}
function assertStep(step: CircularStep) {
  expect(screen.getByRole('status')).toHaveTextContent(step.explanation)
  expect(document.querySelector('[aria-current="step"]')).toHaveAttribute('data-line-id', step.lineId)
  for (const [endpoint, field] of [['HEAD', 'head'], ['TAIL', 'tail']] as const) {
    expect(document.querySelector(`[data-source="${endpoint}"]`)).toHaveAttribute('data-target', step.state[field] ?? 'NULL')
  }
  for (const node of Object.values(step.state.nodes)) {
    const card = document.querySelector(`[data-node-id="${node!.id}"]`)
    expect(card).toHaveAttribute('data-value', node!.id === step.newId && !step.dataAssigned ? 'unassigned' : String(node!.value))
    expect(card).toHaveAttribute('data-next', node!.next ?? 'NULL')
    expect(document.querySelector(`[data-source="${node!.id}"]`)).toHaveAttribute('data-target', node!.next ?? 'NULL')
  }
  expect(document.querySelectorAll('[data-source]')).toHaveLength(2 + Object.keys(step.state.nodes).length)
  expect(screen.getByLabelText('Current list')).toHaveTextContent(circularSummary(step.state))
}
const operations: ListOperation[] = [
  { kind: 'traverse' }, { kind: 'insert-start', value: -5 }, { kind: 'insert-end', value: 20 },
  { kind: 'insert-position', value: 15, position: 1 }, { kind: 'delete-start' }, { kind: 'delete-end' }, { kind: 'delete-position', position: 1 },
]
test.each(operations)('$kind restores every circular pointer, explanation, and code line with Next and Previous', (operation) => {
  renderPage(); apply(operation)
  const trace = createCircularTrace(createCircularList(), operation)
  assertStep(trace[0])
  for (let index = 1; index < trace.length; index += 1) { click('Next Step'); assertStep(trace[index]) }
  expect(screen.getByRole('button', { name: /Next Step/ })).toBeDisabled()
  const saved = screen.getByLabelText('Saved list').textContent
  for (let index = trace.length - 2; index >= 0; index -= 1) { click('Previous Step'); assertStep(trace[index]) }
  expect(screen.getByRole('button', { name: /Previous Step/ })).toBeDisabled()
  expect(screen.getByLabelText('Saved list')).toHaveTextContent(saved!)
})

test.each([0.5, 1, 2, 4])('autoplay at %s×, pause, reset, and replay commit exactly once', (speed) => {
  const { unmount } = renderPage()
  const operation = { kind: 'insert-end', value: -2 } as const
  const trace = createCircularTrace(createCircularList(), operation)
  apply(operation); fill('Speed', String(speed)); click('Play')
  expect(screen.getByRole('button', { name: 'Apply Operation' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Clear List' })).toBeDisabled()
  tick(1000 / speed - 1); assertStep(trace[0])
  tick(1); assertStep(trace[1])
  click('Pause'); tick(5000); assertStep(trace[1])
  click('Reset'); assertStep(trace[0]); click('Play')
  for (let i = 1; i < trace.length; i += 1) { tick(1000 / speed); assertStep(trace[i]) }
  expect(screen.getByRole('button', { name: 'Replay' })).toBeVisible()
  expect(screen.getByRole('progressbar')).toHaveValue(100)
  expect(vi.getTimerCount()).toBe(0)
  expect(screen.getByLabelText('Saved list')).toHaveTextContent('10 → 20 → 30 → -2 → HEAD (loop)')
  click('Replay')
  for (let i = 1; i < trace.length; i += 1) tick(1000 / speed)
  click('Reset'); assertStep(trace[0])
  apply({ kind: 'delete-end' }); finish()
  expect(screen.getByLabelText('Saved list')).toHaveTextContent('10 → 20 → 30 → HEAD (loop)')
  click('Replay'); unmount()
  expect(vi.getTimerCount()).toBe(0)
})

test.each(['singly', 'doubly'])('switching circular → %s → circular during autoplay preserves saved IDs and cancels timers', (type) => {
  renderPage()
  apply({ kind: 'insert-position', value: -9, position: 1 }); finish()
  const ids = [...document.querySelectorAll('[data-node-id]')].map((node) => node.getAttribute('data-node-id'))
  apply({ kind: 'delete-start' }); click('Play'); tick(); tick()
  fill('List type', type)
  expect(screen.getByLabelText('Current list')).toHaveTextContent('10 → -9 → 20 → 30 → NULL')
  expect(document.querySelector('[data-loop]')).toBeNull()
  expect(vi.getTimerCount()).toBe(0)
  if (type === 'doubly') fill('Operation', 'traverse-backward')
  else fill('Operation', 'delete-end')
  click('Apply Operation'); click('Play'); tick()
  fill('List type', 'circular')
  expect(screen.getByLabelText('Operation')).toHaveValue('traverse')
  expect(screen.queryByRole('option', { name: 'Traverse backward' })).toBeNull()
  expect(screen.queryByLabelText('Backward list')).toBeNull()
  expect(screen.getByLabelText('Current list')).toHaveTextContent('10 → -9 → 20 → 30 → HEAD (loop)')
  expect([...document.querySelectorAll('[data-node-id]')].map((node) => node.getAttribute('data-node-id'))).toEqual(ids)
  expect(document.querySelector('[data-state*="Current"]')).toBeNull()
  expect(document.querySelector('[aria-current="step"]')).toHaveAttribute('data-line-id', 'ready')
  tick(5000)
  expect(screen.getByRole('progressbar')).toHaveValue(0)
  expect(vi.getTimerCount()).toBe(0)
})

test('invalid operations preserve state; empty lists and self-loops render and chain correctly', () => {
  renderPage()
  apply({ kind: 'insert-position', value: 0, position: 1 }); click('Next Step')
  const preview = document.querySelector('.list-visual-panel')!.innerHTML
  for (const [field, value] of [['Value', ''], ['Value', '100'], ['Value', '1.5'], ['Position', '-1'], ['Position', '4']]) {
    fill('Value', '0'); fill('Position', '1'); fill(field, value); click('Apply Operation')
    expect(screen.getByRole('alert')).toBeVisible()
    expect(document.querySelector('.list-visual-panel')!.innerHTML).toBe(preview)
    expect(screen.getByLabelText('Saved list')).toHaveTextContent('10 → 20 → 30 → HEAD (loop)')
  }
  click('Clear List')
  expect(document.querySelector('[data-loop]')).toBeNull()
  expect(document.querySelector('[data-source="HEAD"]')).toHaveAttribute('data-target', 'NULL')
  expect(document.querySelector('[data-source="TAIL"]')).toHaveAttribute('data-target', 'NULL')
  apply({ kind: 'traverse' }); finish()
  expect(screen.getByRole('status')).toHaveTextContent('no nodes to visit')
  apply({ kind: 'delete-end' }); finish()
  expect(screen.getByRole('status')).toHaveTextContent('without changes')
  apply({ kind: 'delete-position', position: 0 })
  expect(screen.getByRole('alert')).toHaveTextContent('empty')
  apply({ kind: 'insert-end', value: -99 }); finish()
  expect(document.querySelector('[data-source="n4"]')).toHaveAttribute('data-target', 'n4')
  expect(document.querySelector('[data-source="n4"]')).toHaveAttribute('data-loop', 'self')
  apply({ kind: 'traverse' }); finish()
  expect(screen.getByLabelText('Traversal sequence').textContent).toBe('Read so far -99')
  apply({ kind: 'delete-start' }); finish()
  expect(document.querySelector('[data-node-id]')).toBeNull()
  click('Restore Example')
  expect(screen.getByLabelText('Current list')).toHaveTextContent('10 → 20 → 30 → HEAD (loop)')
  expect(document.querySelector('[data-loop="return"]')).toHaveAttribute('data-target', 'n5')
})

test('switching operations pauses playback and removes stale pointer highlights', () => {
  renderPage(); apply({ kind: 'traverse' }); click('Play'); tick(); tick(); tick()
  fill('Operation', 'delete-start')
  expect(vi.getTimerCount()).toBe(0)
  expect(document.querySelector('.is-followed')).toBeNull()
  expect(screen.getByRole('button', { name: 'Play' })).toBeDisabled()
})
