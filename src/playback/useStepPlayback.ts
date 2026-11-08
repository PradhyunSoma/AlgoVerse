import { useEffect, useRef, useState } from 'react'

export const playbackSpeeds = [
  { value: 0.5, label: '0.5× — Slow' },
  { value: 1, label: '1× — Normal' },
  { value: 2, label: '2× — Fast' },
  { value: 4, label: '4× — Very fast' },
] as const
export type PlaybackSpeed = typeof playbackSpeeds[number]['value']
export const NORMAL_STEP_DELAY_MS = 1000

interface PlaybackState {
  index: number
  isPlaying: boolean
  speed: PlaybackSpeed
}

/** A bounded cursor and one pending timeout, independent of algorithm data. */
export function useStepPlayback(stepCount: number) {
  const [state, setState] = useState<PlaybackState>({ index: 0, isPlaying: false, speed: 1 })
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastIndex = Math.max(0, stepCount - 1)
  const index = Math.min(state.index, lastIndex)
  const isPlaying = state.isPlaying && index < lastIndex

  function cancelTimer() {
    if (timer.current !== null) clearTimeout(timer.current)
    timer.current = null
  }

  useEffect(() => {
    if (!state.isPlaying || state.index >= lastIndex) return
    const timeout = setTimeout(() => {
      setState((current) => {
        const nextIndex = Math.min(current.index + 1, lastIndex)
        return { ...current, index: nextIndex, isPlaying: nextIndex < lastIndex }
      })
    }, NORMAL_STEP_DELAY_MS / state.speed)
    timer.current = timeout
    return () => clearTimeout(timeout)
  }, [state, lastIndex])

  function pause() {
    cancelTimer()
    setState((current) => ({ ...current, isPlaying: false }))
  }

  function reset() {
    cancelTimer()
    setState((current) => ({ ...current, index: 0, isPlaying: false }))
  }

  function move(direction: -1 | 1) {
    cancelTimer()
    setState((current) => ({
      ...current,
      index: Math.max(0, Math.min(Math.min(current.index, lastIndex) + direction, lastIndex)),
      isPlaying: false,
    }))
  }

  function setSpeed(speed: PlaybackSpeed) {
    if (speed === state.speed) return
    cancelTimer()
    setState((current) => ({ ...current, speed }))
  }

  return {
    index,
    isPlaying,
    speed: state.speed,
    canPrevious: index > 0,
    canNext: index < lastIndex,
    canPlay: stepCount > 1,
    isComplete: stepCount > 0 && index === lastIndex,
    play: () => setState((current) => {
      if (current.isPlaying && current.index < lastIndex) return current
      return {
        ...current,
        index: current.index >= lastIndex ? 0 : current.index,
        isPlaying: stepCount > 1,
      }
    }),
    pause,
    reset,
    setSpeed,
    previous: () => move(-1),
    next: () => move(1),
  }
}
