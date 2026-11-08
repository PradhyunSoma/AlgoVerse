import { StrictMode } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import BinaryTreePage from './BinaryTreePage'
import { EXAMPLE_TREE_INPUT, parseTreeInput } from './treeModel'
import { createTreeTrace, type TreeStep } from './treeTrace'
import { traversalLabels, type TraversalKind } from './treeTraversals'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
const fill = (name: string, value: string) => fireEvent.change(screen.getByLabelText(name), { target: { value } })
const tick = (ms = 1000) => act(() => vi.advanceTimersByTime(ms))
const kinds = Object.keys(traversalLabels) as TraversalKind[]
function setup() { return render(<StrictMode><MemoryRouter><BinaryTreePage /></MemoryRouter></StrictMode>) }
function apply(text: string) { fill('Level-order values', text); click('Apply Tree') }
function finish() {
  let count = 0
  while (!(screen.getByRole('button', { name: /Next Step/ }) as HTMLButtonElement).disabled) {
    click('Next Step')
    if (++count > 200) throw new Error('Traversal did not finish')
  }
}
function assertStep(step: TreeStep, kind: TraversalKind) {
  expect(screen.getByRole('status')).toHaveTextContent(step.explanation)
  expect(document.querySelector('[aria-current="step"]')).toHaveAttribute('data-line-id', step.lineId)
  expect(screen.getByLabelText('Traversal output')).toHaveTextContent(step.output.length ? step.output.map((id) => step.tree.nodes[id]!.value).join(' → ') : 'No values visited yet')
  expect(screen.getByLabelText('Output node IDs')).toHaveTextContent(step.output.length ? step.output.join(' → ') : 'Node IDs appear here')
  for (const node of Object.values(step.tree.nodes)) {
    const card = document.querySelector(`[data-node-id="${node!.id}"]`)
    expect(card).toHaveAttribute('data-current', String(step.current === node!.id))
    expect(card).toHaveAttribute('data-visited', String(step.output.includes(node!.id)))
    expect(card).toHaveAttribute('data-completed', String(step.completed.includes(node!.id)))
    expect(card).toHaveAttribute('data-queued', String(step.queue.includes(node!.id)))
    expect(card).toHaveAttribute('data-path', String(step.stack.some((frame) => frame.nodeId === node!.id)))
    for (const side of ['left', 'right'] as const) {
      const edge = document.querySelector(`[data-source="${node!.id}"][data-side="${side}"]`)
      expect(edge).toHaveAttribute('data-target', node![side] ?? 'NULL')
      expect(edge).toHaveAttribute('data-active', String(step.transition?.source === node!.id && step.transition.side === side))
    }
  }
  if (kind === 'level-order') {
    expect([...document.querySelectorAll('[data-queued-id]')].map((node) => node.getAttribute('data-queued-id'))).toEqual(step.queue)
    expect(screen.queryByRole('list', { name: 'Recursion call stack' })).toBeNull()
  } else {
    expect([...document.querySelectorAll('[data-call-id]')].map((node) => node.getAttribute('data-call-id'))).toEqual(step.stack.map((frame) => frame.callId))
    expect(screen.queryByRole('list', { name: 'BFS queue' })).toBeNull()
  }
}

test.each(kinds)('%s restores highlights, output, stack/queue, and pseudocode exactly with Next/Previous', (kind) => {
  setup(); apply('1,2,3'); fill('Traversal', kind)
  const trace = createTreeTrace(parseTreeInput('1,2,3', 7), kind)
  const positions = [...document.querySelectorAll('[data-node-id]')].map((node) => node.getAttribute('transform'))
  assertStep(trace[0], kind)
  expect(screen.getByRole('button', { name: /Previous Step/ })).toBeDisabled()
  for (let i = 1; i < trace.length; i += 1) {
    click('Next Step'); assertStep(trace[i], kind)
    expect([...document.querySelectorAll('[data-node-id]')].map((node) => node.getAttribute('transform'))).toEqual(positions)
  }
  expect(screen.getByRole('button', { name: /Next Step/ })).toBeDisabled()
  for (let i = trace.length - 2; i >= 0; i -= 1) { click('Previous Step'); assertStep(trace[i], kind) }
})

test.each([0.5, 1, 2, 4])('shared playback at %s× supports pause, reset, replay, and automatic stop', (speed) => {
  const { unmount } = setup(); apply('8')
  const trace = createTreeTrace(parseTreeInput('8', 7), 'preorder')
  fill('Speed', String(speed)); click('Play')
  tick(1000 / speed - 1); assertStep(trace[0], 'preorder')
  tick(1); assertStep(trace[1], 'preorder')
  click('Pause'); tick(5000); assertStep(trace[1], 'preorder')
  click('Reset'); assertStep(trace[0], 'preorder')
  click('Play')
  for (let i = 1; i < trace.length; i += 1) tick(1000 / speed)
  assertStep(trace.at(-1)!, 'preorder')
  expect(screen.getByRole('button', { name: 'Replay' })).toBeVisible()
  expect(screen.getByRole('progressbar')).toHaveValue(100)
  expect(vi.getTimerCount()).toBe(0)
  click('Replay'); assertStep(trace[0], 'preorder')
  for (let i = 1; i < trace.length; i += 1) tick(1000 / speed)
  assertStep(trace.at(-1)!, 'preorder')
  click('Replay'); unmount(); expect(vi.getTimerCount()).toBe(0)
})

test('changing traversal during autoplay preserves the valid tree and discards old stack/queue/highlights', () => {
  setup(); apply('-4, -4, 9, null, 2')
  const tree = parseTreeInput('-4, -4, 9, null, 2', 7)
  for (const kind of ['level-order', 'postorder', 'inorder', 'preorder'] as const) {
    click('Play'); tick(); tick()
    fill('Traversal', kind)
    expect(vi.getTimerCount()).toBe(0)
    assertStep(createTreeTrace(tree, kind)[0], kind)
    expect(screen.getByLabelText('Level-order values')).toHaveValue('-4, -4, 9, null, 2')
    tick(10000)
    expect(screen.getByRole('progressbar')).toHaveValue(0)
  }
})
test('BFS autoplay stops with example output and replay clears its queue/output', () => {
  setup(); fill('Traversal', 'level-order'); fill('Speed', '4')
  const trace = createTreeTrace(parseTreeInput(EXAMPLE_TREE_INPUT), 'level-order')
  click('Play')
  for (let i = 1; i < trace.length; i += 1) tick(250)
  assertStep(trace.at(-1)!, 'level-order')
  expect(screen.getByLabelText('Traversal output')).toHaveTextContent('1 → 2 → 3 → 4 → 5 → 6')
  expect(vi.getTimerCount()).toBe(0)
  click('Replay'); assertStep(trace[0], 'level-order')
  click('Pause')
})
test('invalid input preserves tree and exact step while pausing autoplay; valid input resets it', () => {
  setup(); click('Next Step'); click('Next Step'); click('Play')
  const before = screen.getByRole('status').textContent
  const diagram = document.querySelector('.tree-figure')!.innerHTML
  for (const invalid of ['1,,2', 'null, 7', '1,null,null,9', '1,null,null,null', '100', '2.5']) {
    apply(invalid)
    expect(screen.getByRole('alert')).toBeVisible()
    expect(screen.getByRole('status').textContent).toBe(before)
    expect(document.querySelector('.tree-figure')!.innerHTML).toBe(diagram)
    expect(vi.getTimerCount()).toBe(0)
  }
  apply('1,null,2,3')
  expect(screen.queryByRole('alert')).toBeNull()
  expect(screen.getByRole('progressbar')).toHaveValue(0)
  expect(document.querySelectorAll('[data-node-id]')).toHaveLength(3)
  finish()
  expect(screen.getByLabelText('Traversal output')).toHaveTextContent('1 → 2 → 3')
})
test('clear and restore during playback are safe, with accessible empty state and scroll region', () => {
  setup(); click('Play'); tick(); click('Clear Tree')
  expect(vi.getTimerCount()).toBe(0)
  expect(screen.getByRole('img')).toHaveAccessibleName('Binary tree. ROOT points to NULL.')
  expect(screen.getByLabelText('Level-order values')).toHaveValue('')
  expect(screen.getByRole('region', { name: 'Binary tree diagram, scroll to explore' })).toHaveAttribute('tabindex', '0')
  for (const kind of kinds) { fill('Traversal', kind); finish(); expect(screen.getByLabelText('Traversal output')).toHaveTextContent('No values visited yet') }
  click('Replay'); click('Restore Example')
  expect(vi.getTimerCount()).toBe(0)
  expect(document.querySelectorAll('[data-node-id]')).toHaveLength(6)
  expect(screen.getByRole('progressbar')).toHaveValue(0)
})
