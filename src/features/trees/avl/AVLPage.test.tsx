import { StrictMode } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import AVLPage from './AVLPage'
import TreesPage from '../TreesPage'
import { createAVL } from './avlOperations'
import { rotationPresets, type AVLTree, type RotationCase } from './avlModel'
import { createAVLTrace, type AVLStep } from './avlTrace'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
const fill = (name: string, value: string) => fireEvent.change(screen.getByLabelText(name), { target: { value } })
const tick = (ms = 1000) => act(() => vi.advanceTimersByTime(ms))
const saved = () => screen.getByLabelText('Saved AVL').textContent
function setup(tree = createAVL([]), onSave?: (tree: AVLTree) => void) {
  return render(<StrictMode><MemoryRouter><AVLPage initialTree={tree} onSave={onSave} /></MemoryRouter></StrictMode>)
}
function preset(which: RotationCase) { click(`${which}: ${rotationPresets[which].join(', ')}`) }
function apply(kind: 'insert' | 'delete' | 'search', value: number | string) {
  fill('AVL operation', kind); fill('Value', String(value)); click(kind === 'insert' ? 'Insert' : kind === 'delete' ? 'Delete' : 'Search')
}
function finish() {
  let count = 0
  while (!(screen.getByRole('button', { name: /Next Step/ }) as HTMLButtonElement).disabled) {
    click('Next Step')
    if (++count > 250) throw new Error('Operation did not finish')
  }
}
function assertStep(step: AVLStep) {
  expect(screen.getByRole('status')).toHaveTextContent(step.explanation)
  expect(document.querySelector('[aria-current="step"]')).toHaveAttribute('data-line-id', step.lineId)
  expect(document.querySelectorAll('[data-node-id]')).toHaveLength(Object.keys(step.tree.nodes).length)
  expect(screen.getByRole('img')).toHaveAccessibleName(`Binary tree. ROOT points to ${step.tree.root ?? 'NULL'}.`)
  for (const node of Object.values(step.tree.nodes)) {
    const card = document.querySelector(`[data-node-id="${node!.id}"]`)!
    const metric = step.metrics[node!.id]!
    expect(card).toHaveAttribute('data-value', String(node!.value))
    expect(card).toHaveAttribute('data-height-pending', String(metric.pending))
    expect(card.querySelector('.tree-node-metrics')).toHaveTextContent(`h:${node!.height}${metric.pending ? '*' : ''} BF:${metric.balance > 0 ? '+' : ''}${metric.balance}`)
    for (const side of ['left', 'right'] as const) expect(document.querySelector(`[data-source="${node!.id}"][data-side="${side}"]`)).toHaveAttribute('data-target', node![side] ?? 'NULL')
  }
  if (step.pointer) expect(screen.getByLabelText('Pointer update')).toHaveTextContent(`${step.pointer.from ?? 'NULL'} → ${step.pointer.to ?? 'NULL'}`)
  else expect(screen.queryByLabelText('Pointer update')).toBeNull()
  if (step.rotation) expect(screen.getByLabelText('AVL balancing state')).toHaveTextContent(`${step.rotation.direction === 'left' ? 'Left' : 'Right'} rotation · ${step.rotation.part}`)
}
test.each(Object.keys(rotationPresets) as RotationCase[])('%s preset restores exact nodes, heights, layout, pointer changes, and pseudocode', (which) => {
  setup(); preset(which)
  const values = rotationPresets[which]
  const trace = createAVLTrace(createAVL(values.slice(0, 2)), { kind: 'insert', value: values[2] })
  const snapshots: string[] = []
  assertStep(trace[0]); snapshots.push(document.querySelector('.tree-figure')!.innerHTML)
  for (let i = 1; i < trace.length; i += 1) {
    click('Next Step'); assertStep(trace[i]); snapshots.push(document.querySelector('.tree-figure')!.innerHTML)
  }
  expect(screen.getByRole('button', { name: /Next Step/ })).toBeDisabled()
  expect(saved()).toContain('10 → 20 → 30')
  for (let i = trace.length - 2; i >= 0; i -= 1) {
    click('Previous Step'); assertStep(trace[i]); expect(document.querySelector('.tree-figure')!.innerHTML).toBe(snapshots[i])
    expect(saved()).toContain('10 → 20 → 30')
  }
  expect(screen.getByRole('button', { name: /Previous Step/ })).toBeDisabled()
})
test.each([0.5, 1, 2, 4])('shared playback at %s× pauses, resets, stops, replays, and commits once', (speed) => {
  const save = vi.fn(), tree = createAVL([30, 20])
  const { unmount } = setup(tree, save)
  apply('insert', 10)
  const trace = createAVLTrace(tree, { kind: 'insert', value: 10 })
  fill('Speed', String(speed)); click('Play')
  expect(screen.getByRole('button', { name: 'Insert' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Clear Tree' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'LR: 30, 10, 20' })).toBeDisabled()
  tick(1000 / speed - 1); assertStep(trace[0]); tick(1); assertStep(trace[1])
  click('Pause'); tick(10000); assertStep(trace[1])
  click('Reset'); assertStep(trace[0]); click('Play')
  for (let i = 1; i < trace.length; i += 1) tick(1000 / speed)
  assertStep(trace.at(-1)!); expect(vi.getTimerCount()).toBe(0)
  expect(screen.getByRole('progressbar')).toHaveValue(100)
  const checkpoint = saved(), commits = save.mock.calls.length
  click('Replay'); assertStep(trace[0])
  for (let i = 1; i < trace.length; i += 1) tick(1000 / speed)
  expect(saved()).toBe(checkpoint); expect(save).toHaveBeenCalledTimes(commits)
  click('Reset'); expect(saved()).toBe(checkpoint)
  apply('delete', 30); finish()
  expect(saved()).toContain('10 → 20'); expect(document.querySelectorAll('[data-node-id]')).toHaveLength(2)
  apply('insert', -5); finish()
  expect(document.querySelector('[data-node-id="t4"]')).toHaveAttribute('data-value', '-5')
  click('Replay'); unmount(); expect(vi.getTimerCount()).toBe(0)
})
test('deletion rotation restores prior structure and height state, and subsequent search uses the saved result', () => {
  const tree = createAVL([30, 10, 40, 20])
  setup(tree); apply('delete', 40)
  const trace = createAVLTrace(tree, { kind: 'delete', value: 40 })
  for (let i = 1; i < trace.length; i += 1) { click('Next Step'); assertStep(trace[i]) }
  click('Reset'); assertStep(trace[0]); finish()
  apply('search', 40); finish(); expect(screen.getByLabelText('Operation result')).toHaveTextContent('missing')
  apply('search', 20); finish(); expect(screen.getByLabelText('Operation result')).toHaveTextContent('found · 20')
  expect(document.querySelectorAll('[data-node-id]')).toHaveLength(3)
})
test('invalid values and duplicates preserve the saved tree and exact current trace', () => {
  setup(createAVL([0, -5, 5])); apply('insert', 3); click('Next Step')
  const before = document.querySelector('.tree-figure')!.innerHTML, text = screen.getByRole('status').textContent, checkpoint = saved()
  for (const value of ['0', '', '1.5', '100', 'NaN']) {
    fill('Value', value); click('Insert')
    expect(screen.getByRole('alert')).toBeVisible()
    expect(document.querySelector('.tree-figure')!.innerHTML).toBe(before)
    expect(screen.getByRole('status').textContent).toBe(text); expect(saved()).toBe(checkpoint)
  }
  fill('Value', '3'); click('Insert'); finish(); expect(saved()).toContain('-5 → 0 → 3 → 5')
})
test('operation switching cancels playback; extrema and all shared traversals retain height labels', () => {
  setup(createAVL([20, 10, 30])); apply('insert', 5); click('Play'); tick()
  fill('AVL operation', 'minimum'); expect(vi.getTimerCount()).toBe(0)
  click('Apply Operation'); finish(); expect(screen.getByLabelText('Operation result')).toHaveTextContent('found · 10')
  fill('AVL operation', 'maximum'); click('Apply Operation'); finish(); expect(screen.getByLabelText('Operation result')).toHaveTextContent('found · 30')
  for (const [kind, output] of Object.entries({ preorder: '20 → 10 → 30', inorder: '10 → 20 → 30', postorder: '10 → 30 → 20', 'level-order': '20 → 10 → 30' })) {
    fill('AVL operation', kind); finish()
    expect(screen.getByLabelText('Traversal output')).toHaveTextContent(output)
    expect(screen.getByRole('list', { name: kind === 'level-order' ? 'BFS queue' : 'Recursion call stack' })).toBeInTheDocument()
    expect(document.querySelectorAll('.tree-node-metrics')).toHaveLength(3)
  }
  click('Clear Tree'); finish(); expect(document.querySelectorAll('[data-node-id]')).toHaveLength(0)
  apply('delete', 0); finish(); expect(screen.getByLabelText('Operation result')).toHaveTextContent('missing')
  click('Restore Sample AVL'); expect(document.querySelectorAll('[data-node-id]')).toHaveLength(7)
})
test('all three tree types preserve independent committed states and cancel unfinished playback', () => {
  render(<StrictMode><MemoryRouter><TreesPage /></MemoryRouter></StrictMode>)
  fill('Level-order values', '1,9,-5,9'); click('Apply Tree')
  fill('Tree type', 'bst'); fill('Value', '25'); click('Apply Operation'); finish()
  const bstSaved = screen.getByLabelText('Saved BST').textContent
  fill('Tree type', 'avl'); expect(screen.getByLabelText('Tree type')).toHaveFocus()
  preset('LR'); finish(); const checkpoint = saved()
  apply('delete', 20); click('Play'); tick()
  fill('Tree type', 'bst'); tick(0); expect(vi.getTimerCount()).toBe(0)
  expect(screen.getByLabelText('Saved BST').textContent).toBe(bstSaved)
  fill('Tree type', 'binary'); expect(screen.getByLabelText('Level-order values')).toHaveValue('1,9,-5,9')
  fill('Tree type', 'avl'); expect(saved()).toBe(checkpoint)
  expect(screen.getByRole('progressbar')).toHaveValue(0)
  tick(10000); expect(saved()).toBe(checkpoint)
})
