import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import LinkedListPage from './LinkedListPage'
import { createList, listSummary } from './listModel'
import { operationLabels, type ListOperation, type OperationKind } from './listOperations'
import { createListTrace, type ListStep } from './listTrace'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
const tick = (ms = 1000) => act(() => vi.advanceTimersByTime(ms))
const select = (kind: OperationKind) => fireEvent.change(screen.getByLabelText('Operation'), { target: { value: kind } })
const fill = (name: string, value: string) => fireEvent.change(screen.getByLabelText(name), { target: { value } })
function renderPage() { return render(<MemoryRouter><LinkedListPage /></MemoryRouter>) }
function apply(operation: ListOperation) {
  select(operation.kind)
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
function assertStep(step: ListStep) {
  expect(screen.getByRole('status')).toHaveTextContent(step.explanation)
  expect(document.querySelector('[aria-current="step"]')).toHaveAttribute('data-line-id', step.lineId)
  expect(screen.getByLabelText('Current list')).toHaveTextContent(listSummary(step.state))
  expect(document.querySelector('[data-source="HEAD"]')).toHaveAttribute('data-target', step.state.head ?? 'NULL')
  for (const node of Object.values(step.state.nodes)) {
    const card = document.querySelector(`[data-node-id="${node!.id}"]`)
    expect(card).toHaveAttribute('data-next', node!.next ?? 'NULL')
    expect(card).toHaveAttribute('data-value', node!.id === step.newId && !step.dataAssigned ? 'unassigned' : String(node!.value))
    expect(document.querySelector(`[data-source="${node!.id}"]`)).toHaveAttribute('data-target', node!.next ?? 'NULL')
  }
  expect(document.querySelectorAll('[data-source]')).toHaveLength(Object.keys(step.state.nodes).length + 1)
}

const operations: ListOperation[] = [
  { kind: 'traverse' }, { kind: 'insert-start', value: -5 }, { kind: 'insert-end', value: 20 },
  { kind: 'insert-position', value: 15, position: 1 }, { kind: 'delete-start' }, { kind: 'delete-end' }, { kind: 'delete-position', position: 1 },
]
test.each(operations)('$kind synchronizes pointers, explanations, and code in both directions', (operation) => {
  renderPage()
  apply(operation)
  const trace = createListTrace(createList(), operation)
  assertStep(trace[0])
  expect(screen.getByRole('button', { name: /Previous Step/ })).toBeDisabled()
  for (let i = 1; i < trace.length; i += 1) { click('Next Step'); assertStep(trace[i]) }
  expect(screen.getByLabelText('Saved list')).toHaveTextContent(listSummary(trace.at(-1)!.state))
  expect(screen.getByRole('button', { name: /Next Step/ })).toBeDisabled()
  for (let i = trace.length - 2; i >= 0; i -= 1) { click('Previous Step'); assertStep(trace[i]) }
  expect(screen.getByLabelText('Saved list')).toHaveTextContent(listSummary(trace.at(-1)!.state))
})

test.each([0.5, 1, 2, 4])('autoplay at %s× supports pause, reset, replay, and stops at completion', (speed) => {
  const { unmount } = renderPage()
  const operation = { kind: 'insert-end', value: -2 } as const
  apply(operation)
  const trace = createListTrace(createList(), operation)
  fill('Speed', String(speed))
  click('Play')
  expect(screen.getByRole('button', { name: 'Apply Operation' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Clear List' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Restore Example' })).toBeDisabled()
  expect(screen.getByLabelText('Value')).toBeDisabled()
  tick(1000 / speed - 1)
  assertStep(trace[0])
  tick(1)
  assertStep(trace[1])
  click('Pause')
  tick(10000)
  assertStep(trace[1])
  click('Next Step')
  assertStep(trace[2])
  click('Previous Step')
  assertStep(trace[1])
  click('Reset')
  assertStep(trace[0])
  click('Play')
  for (let index = 1; index < trace.length; index += 1) { tick(1000 / speed); assertStep(trace[index]) }
  expect(screen.getByRole('button', { name: 'Replay' })).toBeVisible()
  expect(screen.getByRole('progressbar')).toHaveValue(100)
  expect(vi.getTimerCount()).toBe(0)
  click('Replay')
  assertStep(trace[0])
  tick(1000 / speed)
  click('Reset')
  expect(screen.getByLabelText('Saved list')).toHaveTextContent('10 → 20 → 30 → -2 → NULL')
  expect(vi.getTimerCount()).toBe(0)
  click('Play')
  unmount()
  expect(vi.getTimerCount()).toBe(0)
})

test('chains completed operations once, including after rewinding and replaying', () => {
  renderPage()
  apply({ kind: 'insert-position', value: -9, position: 1 })
  finish()
  click('Replay')
  tick()
  select('traverse')
  expect(vi.getTimerCount()).toBe(0)
  expect(screen.getByLabelText('Current list')).toHaveTextContent('10 → -9 → 20 → 30 → NULL')
  apply({ kind: 'delete-end' })
  finish()
  click('Previous Step')
  apply({ kind: 'insert-start', value: 10 })
  finish()
  expect(screen.getByLabelText('Saved list')).toHaveTextContent('10 → 10 → -9 → 20 → NULL')
  expect([...document.querySelectorAll('[data-node-id]')].map((node) => node.getAttribute('data-node-id'))).toEqual(['n5', 'n1', 'n4', 'n2'])
  apply({ kind: 'traverse' })
  finish()
  expect(screen.getByLabelText('Traversal sequence')).toHaveTextContent('10 → 10 → -9 → 20')
})

test('switching operations during autoplay cancels the timer and unfinished preview', () => {
  renderPage()
  apply({ kind: 'insert-start', value: 10 })
  const trace = createListTrace(createList(), { kind: 'insert-start', value: 10 })
  const changed = trace.findIndex((step) => step.kind === 'link-head')
  click('Play')
  for (let i = 0; i < changed; i += 1) tick()
  expect(screen.getByLabelText('Current list')).toHaveTextContent('10 → 10 → 20 → 30 → NULL')
  select('delete-end')
  expect(vi.getTimerCount()).toBe(0)
  expect(screen.getByLabelText('Current list')).toHaveTextContent('10 → 20 → 30 → NULL')
  expect(document.querySelector('[data-node-id="n4"]')).toBeNull()
  expect(document.querySelector('[data-state*="Current"]')).toBeNull()
  expect(document.querySelector('[aria-current="step"]')).toHaveAttribute('data-line-id', 'ready')
  tick(10000)
  expect(document.querySelector('.step-counter')).toHaveTextContent('Step 1 of 1')
  expect(screen.getByRole('button', { name: 'Play' })).toBeDisabled()
  expect(screen.getByRole('progressbar')).toHaveValue(0)
})

test('invalid values and positions preserve the trace, step, and saved list', () => {
  renderPage()
  apply({ kind: 'insert-position', value: 0, position: 1 })
  for (let i = 0; i < 4; i += 1) click('Next Step')
  const before = document.querySelector('.list-visual-panel')!.innerHTML
  for (const [field, text] of [['Value', ''], ['Value', 'nope'], ['Value', '100'], ['Value', '2.5'], ['Position', '-1'], ['Position', '4']]) {
    fill('Value', '0'); fill('Position', '1'); fill(field, text)
    click('Apply Operation')
    expect(screen.getByRole('alert')).toBeVisible()
    expect(document.querySelector('.list-visual-panel')!.innerHTML).toBe(before)
    expect(document.querySelector('.step-counter')).toHaveTextContent('Step 5 of')
    expect(screen.getByLabelText('Saved list')).toHaveTextContent('10 → 20 → 30 → NULL')
  }
})

test('clear, empty operations, singleton deletion, size limits, and restore work', () => {
  renderPage()
  click('Clear List')
  expect(screen.getByLabelText('Current list')).toHaveTextContent('NULL')
  apply({ kind: 'traverse' }); finish()
  expect(screen.getByRole('status')).toHaveTextContent('no nodes to visit')
  apply({ kind: 'delete-start' }); finish()
  expect(screen.getByRole('status')).toHaveTextContent('without changes')
  apply({ kind: 'delete-position', position: 0 })
  expect(screen.getByRole('alert')).toHaveTextContent('empty')
  apply({ kind: 'insert-end', value: -99 }); finish()
  expect(document.querySelector('[data-source="HEAD"]')).toHaveAttribute('data-target', 'n4')
  apply({ kind: 'delete-end' }); finish()
  expect(document.querySelector('[data-source="HEAD"]')).toHaveAttribute('data-target', 'NULL')
  for (let i = 0; i < 8; i += 1) { apply({ kind: 'insert-start', value: i }); finish() }
  apply({ kind: 'insert-end', value: 0 })
  expect(screen.getByRole('alert')).toHaveTextContent('maximum 8')
  expect(document.querySelectorAll('[data-node-id]')).toHaveLength(8)
  click('Restore Example')
  expect(screen.queryByRole('alert')).toBeNull()
  expect(screen.getByLabelText('Current list')).toHaveTextContent('10 → 20 → 30 → NULL')
  expect(screen.getByLabelText('Saved list')).toHaveTextContent('10 → 20 → 30 → NULL')
  expect(Object.values(operationLabels)).toHaveLength(7)
})
