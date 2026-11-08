import { StrictMode } from 'react'
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { useStepPlayback } from './useStepPlayback'

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

function tick(milliseconds: number) {
  act(() => vi.advanceTimersByTime(milliseconds))
}

test('plays one step per delay and Pause cancels the pending step immediately', () => {
  const { result } = renderHook(() => useStepPlayback(5), { wrapper: StrictMode })
  expect(result.current.speed).toBe(1)
  act(() => result.current.play())
  expect(vi.getTimerCount()).toBe(1)
  tick(999)
  expect(result.current.index).toBe(0)
  tick(1)
  expect(result.current.index).toBe(1)
  tick(500)
  act(() => result.current.pause())
  expect(vi.getTimerCount()).toBe(0)
  tick(5000)
  expect(result.current.index).toBe(1)
  act(() => result.current.next())
  expect(result.current.index).toBe(2)
  act(() => result.current.previous())
  expect(result.current.index).toBe(1)
})

test('Reset pauses and returns to the first step while keeping the chosen speed', () => {
  const { result } = renderHook(() => useStepPlayback(6))
  act(() => { result.current.setSpeed(2); result.current.play() })
  tick(500)
  expect(result.current.index).toBe(1)
  act(() => result.current.reset())
  expect(result.current).toMatchObject({ index: 0, isPlaying: false, speed: 2 })
  expect(vi.getTimerCount()).toBe(0)
  tick(5000)
  expect(result.current.index).toBe(0)
})

test('stops exactly at the last step and Replay starts a new run at zero', () => {
  const { result } = renderHook(() => useStepPlayback(4))
  act(() => result.current.play())
  for (let index = 1; index <= 3; index += 1) {
    tick(1000)
    expect(result.current.index).toBe(index)
  }
  expect(result.current).toMatchObject({ isPlaying: false, isComplete: true, canNext: false })
  expect(vi.getTimerCount()).toBe(0)
  tick(5000)
  expect(result.current.index).toBe(3)
  act(() => result.current.play())
  expect(result.current).toMatchObject({ index: 0, isPlaying: true })
  tick(1000)
  expect(result.current.index).toBe(1)
})

test('speed changes restart the pending delay without moving or resetting the cursor', () => {
  const { result } = renderHook(() => useStepPlayback(10))
  act(() => result.current.play())
  tick(1000)
  tick(600)
  act(() => result.current.setSpeed(4))
  expect(result.current.index).toBe(1)
  expect(vi.getTimerCount()).toBe(1)
  tick(249)
  expect(result.current.index).toBe(1)
  tick(1)
  expect(result.current.index).toBe(2)
  act(() => result.current.setSpeed(0.5))
  tick(1999)
  expect(result.current.index).toBe(2)
  tick(1)
  expect(result.current.index).toBe(3)
  act(() => result.current.pause())
  act(() => result.current.setSpeed(2))
  tick(2000)
  expect(result.current).toMatchObject({ index: 3, isPlaying: false })
})

test('manual stepping during playback pauses and repeated Play cannot create overlapping timers', () => {
  const { result } = renderHook(() => useStepPlayback(5))
  act(() => { result.current.play(); result.current.play() })
  expect(vi.getTimerCount()).toBe(1)
  tick(500)
  act(() => result.current.play())
  tick(500)
  expect(result.current.index).toBe(1)
  act(() => result.current.next())
  expect(result.current).toMatchObject({ index: 2, isPlaying: false })
  expect(vi.getTimerCount()).toBe(0)
  act(() => result.current.play())
  act(() => result.current.previous())
  tick(5000)
  expect(result.current).toMatchObject({ index: 1, isPlaying: false })
})

test('cleans up on unmount, including React Strict Mode effect replay', () => {
  const { result, unmount } = renderHook(() => useStepPlayback(5), { wrapper: StrictMode })
  act(() => result.current.play())
  expect(vi.getTimerCount()).toBe(1)
  unmount()
  expect(vi.getTimerCount()).toBe(0)
  tick(5000)
  expect(vi.getTimerCount()).toBe(0)
})

test.each([0, 1])('does not schedule playback for %i steps', (count) => {
  const { result } = renderHook(() => useStepPlayback(count))
  act(() => result.current.play())
  expect(result.current.canPlay).toBe(false)
  expect(result.current.isPlaying).toBe(false)
  expect(vi.getTimerCount()).toBe(0)
})

test('a batched Pause then Play starts one fresh timer', () => {
  const { result } = renderHook(() => useStepPlayback(5))
  act(() => result.current.play())
  tick(500)
  act(() => { result.current.pause(); result.current.play() })
  expect(vi.getTimerCount()).toBe(1)
  tick(999)
  expect(result.current.index).toBe(0)
  tick(1)
  expect(result.current.index).toBe(1)
})
