import { expect, test } from 'vitest'
import type { ComplexityProfile } from './complexity'
import { sortingComplexity } from '../features/sorting/complexity'
import { listComplexity } from '../features/linked-lists/complexity'
import { treeComplexity } from '../features/trees/complexity'
import { graphComplexity } from '../features/graphs/complexity'
import { bubbleSort } from '../features/sorting/bubbleSort'
import { selectionSort } from '../features/sorting/selectionSort'
import { insertionSort } from '../features/sorting/insertionSort'
import { mergeSort } from '../features/sorting/mergeSort'
import { quickSort } from '../features/sorting/quickSort'
import { createList } from '../features/linked-lists/listModel'
import { runListOperation } from '../features/linked-lists/listOperations'
import { runDoublyOperation } from '../features/linked-lists/doublyListOperations'
import { runCircularOperation } from '../features/linked-lists/circularListOperations'
import { toDoublyList } from '../features/linked-lists/doublyListModel'
import { toCircularList } from '../features/linked-lists/circularListModel'
import { parseGraph } from '../features/graphs/graphInput'
import { dijkstra } from '../features/graphs/dijkstra'

const bounds = (profile: ComplexityProfile) => profile.rows.map(row => row.bound)
const notes = (profile: ComplexityProfile) => [profile.why, ...profile.assumptions, ...profile.storage].join(' ')

test.each([
  ['bubble', ['O(n)', 'O(n²)', 'O(n²)', 'O(1)']],
  ['selection', ['O(n²)', 'O(n²)', 'O(n²)', 'O(1)']],
  ['insertion', ['O(n)', 'O(n²)', 'O(n²)', 'O(1)']],
  ['merge', ['O(n log n)', 'O(n log n)', 'O(n log n)', 'O(n)']],
  ['quick', ['O(n log n)', 'O(n log n)', 'O(n²)', 'O(log n)', 'O(n)']],
] as const)('%s declares best, average, worst and auxiliary bounds', (key, expected) => {
  expect(bounds(sortingComplexity[key])).toEqual(expected)
  expect(sortingComplexity[key].rows.slice(0, 3).map(r => r.label)).toEqual([expect.stringMatching(/^Best time/), expect.stringMatching(/^Average time/), expect.stringMatching(/^Worst time/)])
  expect(notes(sortingComplexity[key])).toMatch(/copy/)
})

test('sorting case assumptions correspond to real algorithm behavior', () => {
  const sorted = [1, 2, 3, 4, 5], reverse = [...sorted].reverse()
  const bubble: string[] = [], insertion: string[] = []
  bubbleSort(sorted, e => bubble.push(e.kind))
  insertionSort(sorted, e => insertion.push(e.kind))
  expect(bubble.filter(e => e === 'compare')).toHaveLength(4)
  expect(bubble).toContain('early-exit')
  expect(insertion.filter(e => e === 'compare')).toHaveLength(4)
  expect(insertion).not.toContain('shift')
  for (const input of [sorted, reverse]) {
    let comparisons = 0
    selectionSort(input, e => { if (e.kind === 'compare') comparisons++ })
    expect(comparisons).toBe(10)
  }
  let merges = 0
  mergeSort(sorted, e => { if (e.kind === 'merge-start') merges++ })
  expect(merges).toBe(4)
  for (const input of [sorted, reverse, [2, 2, 2, 2, 2]]) {
    let comparisons = 0
    quickSort(input, (e, values) => {
      if (e.kind === 'compare') comparisons++
      if (e.kind === 'pivot') expect(e.pivotValue).toBe(values[e.high])
    })
    expect(comparisons).toBe(10)
  }
  expect(notes(sortingComplexity.quick)).toContain('no random pivot')
  expect(notes(sortingComplexity.merge)).toContain('always merges')
})

test('endpoint time labels distinguish HEAD-only, prev/TAIL, and circular TAIL models', () => {
  const bound = (p: ComplexityProfile, label: string) => p.rows.find(r => r.label === label)?.bound
  expect(bound(listComplexity.singly, 'Insert at end')).toBe('O(n)')
  expect(bound(listComplexity.doubly, 'Insert at end')).toBe('O(1)')
  expect(bound(listComplexity.circular, 'Insert at end')).toBe('O(1)')
  expect(bound(listComplexity.singly, 'Delete from end')).toBe('O(n)')
  expect(bound(listComplexity.doubly, 'Delete from end')).toBe('O(1)')
  expect(bound(listComplexity.circular, 'Delete from end')).toBe('O(n)')
  for (const p of Object.values(listComplexity)) {
    expect(bound(p, 'Insert at position')).toBe('O(n)')
    expect(bound(p, 'Delete from position')).toBe('O(n)')
    expect(notes(p)).toContain('not a separate implemented control')
    expect(notes(p)).toContain('O(n) time and O(n) memory')
  }
})

test('maintained endpoint assumptions match actual pointer walks', () => {
  const list = createList([10, 20, 30, 40])
  let singlyFollows = 0, doublyFollows = 0, circularFollows = 0
  runListOperation(list, { kind: 'insert-end', value: 50 }, e => { if (e.kind === 'follow') singlyFollows++ })
  runDoublyOperation(toDoublyList(list), { kind: 'delete-end' }, e => { if (e.kind === 'follow') doublyFollows++ })
  runCircularOperation(toCircularList(list), { kind: 'insert-end', value: 50 }, e => { if (e.kind === 'follow') circularFollows++ })
  expect(singlyFollows).toBeGreaterThan(0)
  expect(doublyFollows).toBe(0)
  expect(circularFollows).toBe(0)
  runCircularOperation(toCircularList(list), { kind: 'delete-end' }, e => { if (e.kind === 'follow') circularFollows++ })
  expect(circularFollows).toBeGreaterThan(0)
})

test('tree bounds distinguish height, balancing, live queues, output and instrumentation', () => {
  expect(bounds(treeComplexity.bst)[0]).toBe('O(h)')
  expect(bounds(treeComplexity.avl)[0]).toBe('O(log n)')
  expect(notes(treeComplexity.bst)).toContain('not guaranteed')
  expect(notes(treeComplexity.avl)).toContain('cached heights')
  expect(notes(treeComplexity.avl)).toContain('multiple ancestors')
  for (const p of Object.values(treeComplexity)) {
    expect(p.rows).toContainEqual({ label: 'Recursive traversal stack', bound: 'O(h + 1)' })
    expect(p.rows).toContainEqual({ label: 'Level-order live queue', bound: 'O(w)' })
    expect(p.rows).toContainEqual({ label: 'Stored traversal output', bound: 'O(n)' })
    expect(notes(p)).toContain('deletes dequeued entries')
  }
  expect(notes(treeComplexity.avl)).toContain('O(h²)')
  expect(notes(treeComplexity.bst)).toContain('O(h²)')
})

test('graph metadata accounts for preprocessing, lazy heap entries and reconstruction overhead', () => {
  expect(bounds(graphComplexity.bfs)).toEqual(['O(V + E)', 'O(V)'])
  expect(bounds(graphComplexity.dfs)).toEqual(['O(V + E)', 'O(V)', 'O(V)'])
  expect(bounds(graphComplexity.dijkstra)).toEqual(['O((V + E) log V)', 'O(V)', 'O(E + 1)', 'O(V + E)'])
  expect(notes(graphComplexity.dijkstra)).toContain('not linear minimum selection')
  expect(notes(graphComplexity.dijkstra)).toContain('O(V(V + E))')
  for (const p of Object.values(graphComplexity)) expect(notes(p)).toContain('O(E log V)')
  const graph = parseGraph('A,B,C', 'A-B: 8\nA-C: 1\nC-B: 1', false)
  let stale = false
  const result = dijkstra(graph, 'v1', e => { if (e.kind === 'stale') stale = true })
  expect(stale).toBe(true)
  expect(result.distances.v2).toBe(2)
})
