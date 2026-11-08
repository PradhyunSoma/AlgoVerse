import { StrictMode } from 'react'
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { useTracePlayback } from './useStepPlayback'

beforeEach(() => vi.useFakeTimers())
afterEach(() => { cleanup(); vi.useRealTimers() })
const tick = (ms: number) => act(() => vi.advanceTimersByTime(ms))

test.each([0.5,1,2,4] as const)('independent boundaries share one timer at %s speed', speed => {
  const counts = [3, 6, 1]
  const { result, unmount } = renderHook(() => useTracePlayback(counts), { wrapper: StrictMode })
  act(() => { result.current.setSpeed(speed); result.current.play(); result.current.play() })
  expect(vi.getTimerCount()).toBe(1)
  tick(1000/speed-1); expect(result.current.indices).toEqual([0,0,0])
  tick(1); expect(result.current.indices).toEqual([1,1,0])
  act(() => result.current.pause()); tick(3000); expect(result.current.indices).toEqual([1,1,0])
  act(() => result.current.next()); expect(result.current.indices).toEqual([2,2,0])
  act(() => result.current.next()); expect(result.current.indices).toEqual([2,3,0])
  act(() => result.current.previous()); expect(result.current.indices).toEqual([1,2,0])
  act(() => result.current.next()); expect(result.current.indices).toEqual([2,3,0])
  act(() => result.current.play()); tick(1000/speed); tick(1000/speed)
  expect(result.current.indices).toEqual([2,5,0])
  expect(result.current.isComplete).toBe(true)
  expect(result.current.isPlaying).toBe(false)
  expect(vi.getTimerCount()).toBe(0)
  act(() => result.current.play()); expect(result.current.indices).toEqual([0,0,0])
  tick(1000/speed); expect(result.current.indices).toEqual([1,1,0])
  act(() => result.current.reset()); expect(result.current.indices).toEqual([0,0,0])
  expect(vi.getTimerCount()).toBe(0)
  act(() => result.current.play()); unmount(); expect(vi.getTimerCount()).toBe(0)
})

test('speed changes reschedule without jumping cursors', () => {
  const counts = [4, 8]
  const { result } = renderHook(() => useTracePlayback(counts))
  act(() => result.current.play()); tick(700)
  act(() => result.current.setSpeed(4)); tick(249)
  expect(result.current.indices).toEqual([0,0])
  tick(1); expect(result.current.indices).toEqual([1,1])
  act(() => result.current.previous()); tick(1000)
  expect(result.current.indices).toEqual([0,0])
  expect(vi.getTimerCount()).toBe(0)
})

test('removing all trace steps during playback cleans up the pending timer', () => {
  const { result, rerender } = renderHook(({ counts }) => useTracePlayback(counts), { initialProps: { counts: [3, 6] } })
  act(() => result.current.play())
  expect(vi.getTimerCount()).toBe(1)
  rerender({ counts: [0, 0] })
  expect(result.current.isPlaying).toBe(false)
  expect(vi.getTimerCount()).toBe(0)
  tick(3000);expect(result.current.indices).toEqual([0,0])
})
