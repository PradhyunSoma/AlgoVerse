import { StrictMode } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import BSTPage from './BSTPage'
import TreesPage from '../TreesPage'
import { createBST } from './bstModel'
import { createBSTTrace, type BSTStep } from './bstTrace'
import { layoutBSTSnapshot } from './bstLayout'
import type { BSTOperation } from './bstContext'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
const fill = (name: string, value: string) => fireEvent.change(screen.getByLabelText(name), { target: { value } })
const tick = (ms = 1000) => act(() => vi.advanceTimersByTime(ms))
const saved = () => screen.getByLabelText('Saved BST').textContent
function setup(values?: readonly number[]) {
  return render(<StrictMode><MemoryRouter><BSTPage initialTree={values ? createBST(values) : undefined} /></MemoryRouter></StrictMode>)
}
function apply(operation: BSTOperation) {
  fill('BST operation', operation.kind)
  if ('value' in operation) fill('Value', String(operation.value))
  click('Apply Operation')
}
function finish() {
  let count = 0
  while (!(screen.getByRole('button', { name: /Next Step/ }) as HTMLButtonElement).disabled) {
    click('Next Step')
    if (++count > 200) throw new Error('Operation did not finish')
  }
}
function assertStep(step: BSTStep) {
  expect(screen.getByRole('status')).toHaveTextContent(step.explanation)
  expect(document.querySelector('[aria-current="step"]')).toHaveAttribute('data-line-id', step.lineId)
  expect(document.querySelectorAll('[data-node-id]')).toHaveLength(Object.keys(step.tree.nodes).length)
  expect(screen.getByRole('img')).toHaveAccessibleName(`Binary tree. ROOT points to ${step.tree.root ?? 'NULL'}.`)
  const forest = layoutBSTSnapshot(step.tree)
  for (const node of Object.values(step.tree.nodes)) {
    const card = document.querySelector(`[data-node-id="${node!.id}"]`)
    expect(card).toHaveAttribute('data-value', String(node!.value))
    expect(card).toHaveAttribute('data-current', String(step.current === node!.id))
    expect(card).toHaveAttribute('data-detached', String(forest.detached.includes(node!.id)))
    expect(card).toHaveAttribute('data-target-node', String(step.target === node!.id))
    expect(card).toHaveAttribute('data-successor', String(step.successor === node!.id))
    expect(card).toHaveAttribute('data-new', String(step.newId === node!.id))
    for (const side of ['left', 'right'] as const) {
      expect(document.querySelector(`[data-source="${node!.id}"][data-side="${side}"]`)).toHaveAttribute('data-target', node![side] ?? 'NULL')
    }
  }
  if (step.pointer) expect(screen.getByLabelText('Pointer update')).toHaveTextContent(`${step.pointer.from ?? 'NULL'} → ${step.pointer.to ?? 'NULL'}`)
  else expect(screen.queryByLabelText('Pointer update')).toBeNull()
}

test.each([
  { values: [40, 20, 60, 30], operation: { kind: 'insert', value: 25 } },
  { values: [40, 20, 70, 60, 80, 50, 65, 55], operation: { kind: 'delete', value: 40 } },
  { values: [40, 20, 60, 70], operation: { kind: 'delete', value: 40 } },
] satisfies { values: number[]; operation: BSTOperation }[])('$operation.kind restores exact pointer states, identities, and pseudocode in both directions', ({ values, operation }) => {
  setup(values); apply(operation)
  const trace = createBSTTrace(createBST(values), operation)
  assertStep(trace[0])
  expect(screen.getByRole('button', { name: /Previous Step/ })).toBeDisabled()
  for (let i = 1; i < trace.length; i += 1) { click('Next Step'); assertStep(trace[i]) }
  const checkpoint = saved()
  for (let i = trace.length - 2; i >= 0; i -= 1) { click('Previous Step'); assertStep(trace[i]); expect(saved()).toBe(checkpoint) }
  finish(); expect(saved()).toBe(checkpoint)
})

test.each([0.5, 1, 2, 4])('playback at %s× pauses, resets, replays, and commits only once', (speed) => {
  const { unmount } = setup([])
  apply({ kind: 'insert', value: 0 })
  const trace = createBSTTrace(createBST([]), { kind: 'insert', value: 0 })
  fill('Speed', String(speed)); click('Play')
  expect(screen.getByRole('button', { name: 'Apply Operation' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Clear Tree' })).toBeDisabled()
  tick(1000 / speed - 1); assertStep(trace[0]); tick(1); assertStep(trace[1])
  click('Pause'); tick(5000); assertStep(trace[1])
  click('Reset'); assertStep(trace[0]); click('Play')
  for (let i = 1; i < trace.length; i += 1) tick(1000 / speed)
  assertStep(trace.at(-1)!); expect(vi.getTimerCount()).toBe(0)
  expect(screen.getByRole('progressbar')).toHaveValue(100)
  const checkpoint = saved()
  click('Reset'); assertStep(trace[0]); expect(saved()).toBe(checkpoint)
  finish(); click('Replay'); assertStep(trace[0])
  for (let i = 1; i < trace.length; i += 1) tick(1000 / speed)
  expect(saved()).toBe(checkpoint)
  apply({ kind: 'insert', value: -5 }); finish()
  expect(saved()).toContain('-5')
  expect(document.querySelector('[data-node-id="t2"]')).toHaveAttribute('data-value', '-5')
  apply({ kind: 'delete', value: 0 }); finish()
  expect(document.querySelectorAll('[data-node-id]')).toHaveLength(1)
  expect(document.querySelector('[data-root]')).toHaveAttribute('data-root', 't2')
  click('Replay'); unmount(); expect(vi.getTimerCount()).toBe(0)
})

test('invalid requests preserve the saved tree and exact preview; missing searches and deletions do not mutate', () => {
  setup(); click('Apply Operation'); click('Next Step')
  const before = document.querySelector('.tree-figure')!.innerHTML
  const explanation = screen.getByRole('status').textContent
  const checkpoint = saved()
  for (const input of ['40', '', '100', '1.5', 'NaN']) {
    fill('Value', input); click('Apply Operation')
    expect(screen.getByRole('alert')).toBeVisible()
    expect(document.querySelector('.tree-figure')!.innerHTML).toBe(before)
    expect(screen.getByRole('status').textContent).toBe(explanation)
    expect(saved()).toBe(checkpoint)
  }
  for (const kind of ['search', 'delete'] as const) {
    apply({ kind, value: -99 }); finish()
    expect(screen.getByLabelText('Operation result')).toHaveTextContent('missing')
    expect(saved()).toBe(checkpoint)
  }
  apply({ kind: 'search', value: 30 }); finish()
  expect(screen.getByLabelText('Operation result')).toHaveTextContent('found · 30')
  expect(saved()).toBe(checkpoint)
})

test('operation switching cancels playback and discards an unfinished mutation; extrema and traversals reuse the saved BST', () => {
  setup(); apply({ kind: 'insert', value: 25 }); click('Play'); tick()
  fill('BST operation', 'minimum')
  expect(vi.getTimerCount()).toBe(0)
  expect(screen.getByRole('progressbar')).toHaveValue(0)
  click('Apply Operation'); finish(); expect(screen.getByLabelText('Operation result')).toHaveTextContent('found · 10')
  apply({ kind: 'maximum' }); finish(); expect(screen.getByLabelText('Operation result')).toHaveTextContent('found · 70')
  for (const [kind, output] of Object.entries({ preorder: '40 → 20 → 10 → 30 → 60 → 50 → 70', inorder: '10 → 20 → 30 → 40 → 50 → 60 → 70', postorder: '10 → 30 → 20 → 50 → 70 → 60 → 40', 'level-order': '40 → 20 → 60 → 10 → 30 → 50 → 70' })) {
    fill('BST operation', kind); click('Play'); tick(); click('Pause'); finish()
    expect(screen.getByLabelText('Traversal output')).toHaveTextContent(output)
    expect(screen.getByRole('list', { name: kind === 'level-order' ? 'BFS queue' : 'Recursion call stack' })).toBeInTheDocument()
  }
  expect(saved()).not.toContain('25')
  click('Clear Tree'); finish(); expect(screen.getByLabelText('Traversal output')).toHaveTextContent('No values visited yet')
  apply({ kind: 'minimum' }); finish(); expect(screen.getByLabelText('Operation result')).toHaveTextContent('empty')
  click('Reset to Sample BST'); expect(document.querySelectorAll('[data-node-id]')).toHaveLength(7)
})

test('tree types retain separate committed states, cancel timers, and never apply BST rules to a general tree', () => {
  render(<StrictMode><MemoryRouter><TreesPage /></MemoryRouter></StrictMode>)
  fill('Level-order values', '1,9,-2,9'); click('Apply Tree'); click('Play'); tick()
  fill('Tree type', 'bst'); tick(0); expect(vi.getTimerCount()).toBe(0)
  expect(screen.getByLabelText('Tree type')).toHaveFocus()
  expect(screen.getByRole('heading', { name: 'Binary Search Tree' })).toBeVisible()
  apply({ kind: 'insert', value: 25 }); finish()
  const checkpoint = saved()
  click('Reset'); fill('Tree type', 'binary')
  expect(screen.getByLabelText('Tree type')).toHaveFocus()
  expect(screen.getByLabelText('Level-order values')).toHaveValue('1,9,-2,9')
  expect(document.querySelectorAll('[data-node-id]')).toHaveLength(4)
  fill('Tree type', 'bst'); expect(saved()).toBe(checkpoint)
  expect(screen.getByRole('progressbar')).toHaveValue(0)
  apply({ kind: 'delete', value: 40 }); click('Play'); tick(); tick()
  fill('Tree type', 'binary'); tick(0); expect(vi.getTimerCount()).toBe(0)
  tick(10000); fill('Tree type', 'bst'); expect(saved()).toBe(checkpoint)
  expect(document.querySelector('[data-node-id="t1"]')).toHaveAttribute('data-value', '40')
})
