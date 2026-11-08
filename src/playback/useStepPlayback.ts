import { useEffect, useMemo, useRef, useState } from 'react'

export const playbackSpeeds = [
  { value: 0.5, label: '0.5× — Slow' },
  { value: 1, label: '1× — Normal' },
  { value: 2, label: '2× — Fast' },
  { value: 4, label: '4× — Very fast' },
] as const
export type PlaybackSpeed = typeof playbackSpeeds[number]['value']
export const NORMAL_STEP_DELAY_MS = 1000

interface PlaybackState {
  indices: readonly number[]
  isPlaying: boolean
  speed: PlaybackSpeed
}

/** One timer for one or more independent bounded trace cursors. */
export function useTracePlayback(stepCounts: readonly number[]) {
  const [state, setState] = useState<PlaybackState>({ indices: stepCounts.map(() => 0), isPlaying: false, speed: 1 })
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const limits = useMemo(() => stepCounts.map(count => Math.max(0, count - 1)), [stepCounts])
  const indices = limits.map((limit, i) => Math.min(state.indices[i] ?? 0, limit))
  const isComplete = stepCounts.length > 0 && stepCounts.every((count, i) => count > 0 && indices[i] === limits[i])
  const canNext = indices.some((index, i) => index < limits[i])
  const isPlaying = state.isPlaying && canNext

  function cancelTimer() {
    if (timer.current !== null) clearTimeout(timer.current)
    timer.current = null
  }

  useEffect(() => {
    if (!isPlaying) return
    const timeout = setTimeout(() => {
      setState((current) => {
        const next = limits.map((limit, i) => Math.min((current.indices[i] ?? 0) + 1, limit))
        return { ...current, indices: next, isPlaying: next.some((value, i) => value < limits[i]) }
      })
    }, NORMAL_STEP_DELAY_MS / state.speed)
    timer.current = timeout
    return () => clearTimeout(timeout)
  }, [state, limits, isPlaying])

  function pause() {
    cancelTimer()
    setState((current) => ({ ...current, isPlaying: false }))
  }

  function reset() {
    cancelTimer()
    setState((current) => ({ ...current, indices: limits.map(() => 0), isPlaying: false }))
  }

  function move(direction: -1 | 1) {
    cancelTimer()
    setState((current) => ({
      ...current,
      indices: limits.map((limit, i) => Math.max(0, Math.min(Math.min(current.indices[i] ?? 0, limit) + direction, limit))),
      isPlaying: false,
    }))
  }

  function setSpeed(speed: PlaybackSpeed) {
    if (speed === state.speed) return
    cancelTimer()
    setState((current) => ({ ...current, speed }))
  }

  return {
    indices,
    isPlaying,
    speed: state.speed,
    canPrevious: indices.some(index => index > 0),
    canNext,
    canPlay: stepCounts.some(count => count > 1),
    isComplete,
    play: () => setState((current) => {
      if (current.isPlaying && !isComplete) return current
      return {
        ...current,
        indices: isComplete ? limits.map(() => 0) : current.indices,
        isPlaying: stepCounts.some(count => count > 1),
      }
    }),
    pause,
    reset,
    setSpeed,
    previous: () => move(-1),
    next: () => move(1),
  }
}

/** Preserve the existing single-trace API for all visualizers. */
export function useStepPlayback(stepCount: number) {
  const counts = useMemo(() => [stepCount], [stepCount])
  const playback = useTracePlayback(counts)
  return { ...playback, index: playback.indices[0] }
}
