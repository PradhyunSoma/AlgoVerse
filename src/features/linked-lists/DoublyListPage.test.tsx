import { StrictMode } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import LinkedListPage from './LinkedListPage'
import { createDoublyList, doublyNodes } from './doublyListModel'
import { createDoublyTrace, type DoublyStep } from './doublyListTrace'
import type { DoublyOperation } from './doublyListOperations'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
const fill = (name: string, value: string) => fireEvent.change(screen.getByLabelText(name), { target: { value } })
const tick = (ms = 1000) => act(() => vi.advanceTimersByTime(ms))
function renderPage() {
  const result = render(<StrictMode><MemoryRouter><LinkedListPage /></MemoryRouter></StrictMode>)
  fill('List type', 'doubly')
  return result
}
function apply(operation: DoublyOperation) {
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
function assertStep(step: DoublyStep) {
  expect(screen.getByRole('status')).toHaveTextContent(step.explanation)
  expect(document.querySelector('[aria-current="step"]')).toHaveAttribute('data-line-id', step.lineId)
  for (const [endpoint, field] of [['HEAD', 'head'], ['TAIL', 'tail']] as const) {
    expect(document.querySelector(`[data-source="${endpoint}"]`)).toHaveAttribute('data-target', step.state[field] ?? 'NULL')
  }
  for (const node of Object.values(step.state.nodes)) {
    const card = document.querySelector(`[data-node-id="${node!.id}"]`)
    expect(card).toHaveAttribute('data-value', node!.id === step.newId && !step.dataAssigned ? 'unassigned' : String(node!.value))
    for (const field of ['prev', 'next'] as const) {
      expect(card).toHaveAttribute(`data-${field}`, node![field] ?? 'NULL')
      expect(document.querySelector(`[data-source="${node!.id}"][data-field="${field}"]`)).toHaveAttribute('data-target', node![field] ?? 'NULL')
    }
  }
  expect(document.querySelectorAll('[data-source]')).toHaveLength(2 + 2 * Object.keys(step.state.nodes).length)
  expect(screen.getByLabelText('Current list')).toHaveTextContent([...doublyNodes(step.state).map((node) => node.value), 'NULL'].join(' → '))
  expect(screen.getByLabelText('Backward list')).toHaveTextContent([...doublyNodes(step.state, 'prev').map((node) => node.value), 'NULL'].join(' → '))
}

const operations: DoublyOperation[] = [
  { kind: 'traverse' }, { kind: 'traverse-backward' }, { kind: 'insert-start', value: -5 }, { kind: 'insert-end', value: 20 },
  { kind: 'insert-position', value: 15, position: 1 }, { kind: 'delete-start' }, { kind: 'delete-end' }, { kind: 'delete-position', position: 1 },
]
test.each(operations)('$kind restores every pointer, explanation, and code highlight with Next and Previous', (operation) => {
  renderPage()
  apply(operation)
  const trace = createDoublyTrace(createDoublyList(), operation)
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
  const trace = createDoublyTrace(createDoublyList(), operation)
  apply(operation)
  fill('Speed', String(speed))
  click('Play')
  expect(screen.getByRole('button', { name: 'Apply Operation' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Clear List' })).toBeDisabled()
  tick(1000 / speed - 1); assertStep(trace[0])
  tick(1); assertStep(trace[1])
  click('Pause'); tick(5000); assertStep(trace[1])
  click('Reset'); assertStep(trace[0])
  click('Play')
  for (let i = 1; i < trace.length; i += 1) { tick(1000 / speed); assertStep(trace[i]) }
  expect(screen.getByRole('button', { name: 'Replay' })).toBeVisible()
  expect(screen.getByRole('progressbar')).toHaveValue(100)
  expect(vi.getTimerCount()).toBe(0)
  const saved = screen.getByLabelText('Saved list').textContent
  click('Replay')
  for (let i = 1; i < trace.length; i += 1) tick(1000 / speed)
  expect(screen.getByLabelText('Saved list')).toHaveTextContent(saved!)
  click('Reset')
  assertStep(trace[0])
  apply({ kind: 'delete-end' }); finish()
  expect(screen.getByLabelText('Saved list')).toHaveTextContent('10 → 20 → 30 → NULL')
  click('Replay'); unmount()
  expect(vi.getTimerCount()).toBe(0)
})

test('intermediate diagrams label incomplete links and removal honestly', () => {
  renderPage()
  apply({ kind: 'insert-position', value: 15, position: 1 })
  const trace = createDoublyTrace(createDoublyList(), { kind: 'insert-position', value: 15, position: 1 })
  const partial = trace.findIndex((step) => step.kind === 'connect-left')
  for (let i = 0; i < partial; i += 1) click('Next Step')
  expect(document.querySelector('[data-node-id="n4"]')).toHaveAttribute('data-state', expect.stringContaining('Forward chain only'))
  expect(screen.getByLabelText('Backward list')).toHaveTextContent('30 → 20 → 10 → NULL')
  expect(screen.getByLabelText('Pointer update')).toHaveTextContent('n1.next: n2 → n4')
  finish()
  apply({ kind: 'delete-position', position: 1 })
  const deleted = createDoublyTrace(trace.at(-1)!.state, { kind: 'delete-position', position: 1 })
  const halfway = deleted.findIndex((step) => step.kind === 'bypass-left')
  for (let i = 0; i < halfway; i += 1) click('Next Step')
  expect(document.querySelector('[data-node-id="n4"]')).toHaveAttribute('data-state', expect.stringContaining('Backward chain only'))
  const remove = deleted.findIndex((step) => step.kind === 'remove')
  for (let i = halfway; i < remove; i += 1) click('Next Step')
  expect(document.querySelector('[data-node-id="n4"]')).toHaveAttribute('data-state', 'Removed')
  expect(document.querySelector('[data-source="n4"]')).toBeNull()
  finish()
  expect(document.querySelector('[data-node-id="n4"]')).toBeNull()
})

test('switching types during a partially linked mutation stops timers and preserves the saved input and IDs', () => {
  renderPage()
  apply({ kind: 'insert-position', value: -9, position: 1 }); finish()
  const saved = screen.getByLabelText('Saved list').textContent
  const ids = [...document.querySelectorAll('[data-node-id]')].map((node) => node.getAttribute('data-node-id'))
  apply({ kind: 'delete-start' })
  fill('Speed', '4')
  click('Play'); tick(250); tick(250)
  expect(screen.getByLabelText('Current list')).toHaveTextContent('-9 → 20 → 30 → NULL')
  fill('List type', 'singly')
  expect(screen.getByRole('heading', { name: 'Singly Linked List' })).toBeVisible()
  expect(screen.queryByLabelText('Backward list')).toBeNull()
  expect(document.querySelector('[data-source="TAIL"]')).toBeNull()
  expect(screen.getByLabelText('Saved list')).toHaveTextContent(saved!)
  expect(screen.getByLabelText('Current list')).toHaveTextContent('10 → -9 → 20 → 30 → NULL')
  expect([...document.querySelectorAll('[data-node-id]')].map((node) => node.getAttribute('data-node-id'))).toEqual(ids)
  expect(vi.getTimerCount()).toBe(0)
  expect(screen.getByLabelText('Speed')).toHaveValue('4')
  apply({ kind: 'insert-end', value: 88 }); click('Play'); tick(250)
  fill('List type', 'doubly')
  expect(screen.getByRole('heading', { name: 'Doubly Linked List' })).toBeVisible()
  expect(screen.getByLabelText('Current list')).toHaveTextContent('10 → -9 → 20 → 30 → NULL')
  expect(screen.getByLabelText('Backward list')).toHaveTextContent('30 → 20 → -9 → 10 → NULL')
  expect(document.querySelector('[data-state*="Current"]')).toBeNull()
  expect(document.querySelector('[aria-current="step"]')).toHaveAttribute('data-line-id', 'ready')
  tick(5000)
  expect(screen.getByRole('progressbar')).toHaveValue(0)
  expect(vi.getTimerCount()).toBe(0)
  apply({ kind: 'traverse-backward' }); finish()
  expect(screen.getByLabelText('Traversal sequence')).toHaveTextContent('30 → 20 → -9 → 10')
})

test('switching operations during autoplay cancels the old trace and preserves the checkpoint', () => {
  renderPage()
  apply({ kind: 'traverse-backward' }); click('Play'); tick()
  fill('Operation', 'insert-end')
  expect(vi.getTimerCount()).toBe(0)
  expect(screen.queryByLabelText('Traversal sequence')).toBeNull()
  expect(document.querySelector('[data-state*="Current"]')).toBeNull()
  expect(screen.getByRole('button', { name: 'Play' })).toBeDisabled()
})

test('invalid inputs preserve the preview, and clear/restore plus empty and singleton operations work', () => {
  renderPage()
  apply({ kind: 'insert-position', value: 0, position: 1 }); click('Next Step')
  const preview = document.querySelector('.list-visual-panel')!.innerHTML
  for (const [field, value] of [['Value', ''], ['Value', '100'], ['Value', '1.5'], ['Position', '-1'], ['Position', '4']]) {
    fill('Value', '0'); fill('Position', '1'); fill(field, value); click('Apply Operation')
    expect(screen.getByRole('alert')).toBeVisible()
    expect(document.querySelector('.list-visual-panel')!.innerHTML).toBe(preview)
    expect(screen.getByLabelText('Saved list')).toHaveTextContent('10 → 20 → 30 → NULL')
  }
  click('Clear List')
  apply({ kind: 'traverse-backward' }); finish()
  expect(screen.getByRole('status')).toHaveTextContent('no nodes to visit')
  apply({ kind: 'delete-end' }); finish()
  expect(screen.getByRole('status')).toHaveTextContent('without changes')
  apply({ kind: 'delete-position', position: 0 })
  expect(screen.getByRole('alert')).toHaveTextContent('empty')
  apply({ kind: 'insert-end', value: -99 }); finish()
  expect(document.querySelector('[data-source="HEAD"]')).toHaveAttribute('data-target', 'n4')
  expect(document.querySelector('[data-source="TAIL"]')).toHaveAttribute('data-target', 'n4')
  apply({ kind: 'delete-start' }); finish()
  expect(document.querySelector('[data-source="HEAD"]')).toHaveAttribute('data-target', 'NULL')
  expect(document.querySelector('[data-source="TAIL"]')).toHaveAttribute('data-target', 'NULL')
  click('Restore Example')
  expect(screen.getByLabelText('Current list')).toHaveTextContent('10 → 20 → 30 → NULL')
  expect(screen.getByLabelText('Backward list')).toHaveTextContent('30 → 20 → 10 → NULL')
})
