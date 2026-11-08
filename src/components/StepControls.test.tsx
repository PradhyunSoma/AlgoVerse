import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import StepControls from './StepControls'
import { useStepPlayback } from '../playback/useStepPlayback'

function Lesson({ idle = false }: { idle?: boolean }) {
  const playback = useStepPlayback(idle ? 1 : 3)
  return <StepControls {...playback} total={idle ? 1 : 3} isIdle={idle}
    onPlay={playback.play} onPause={playback.pause} onNext={playback.next} onPrevious={playback.previous}
    onReset={playback.reset} onSpeedChange={playback.setSpeed} />
}
afterEach(() => { cleanup(); vi.useRealTimers() })
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }))

test('status and accessible progress follow pause, manual stepping, completion, replay and reset', () => {
  vi.useFakeTimers(); render(<Lesson />)
  const progress = screen.getByRole('progressbar', { name: 'Execution progress' })
  expect(progress).toHaveAttribute('aria-valuetext', 'Paused. Step 1 of 3.')
  expect(screen.getByRole('button', { name: 'Previous Step' })).toBeDisabled()
  click('Play')
  expect(screen.getByText('Playing. Pause to inspect the current step.')).toHaveAttribute('aria-live', 'polite')
  act(() => vi.advanceTimersByTime(1000))
  expect(progress).toHaveAttribute('aria-valuetext', 'Playing. Step 2 of 3.')
  click('Pause'); act(() => vi.advanceTimersByTime(5000))
  expect(progress).toHaveAttribute('aria-valuetext', 'Paused. Step 2 of 3.')
  click('Next Step')
  expect(progress).toHaveAttribute('aria-valuetext', 'Complete. Step 3 of 3.')
  expect(screen.getByRole('button', { name: 'Next Step' })).toBeDisabled()
  click('Replay')
  expect(progress).toHaveAttribute('aria-valuetext', 'Playing. Step 1 of 3.')
  click('Reset'); act(() => vi.advanceTimersByTime(5000))
  expect(progress).toHaveAttribute('aria-valuetext', 'Paused. Step 1 of 3.')
  expect(screen.getByRole('button', { name: 'Reset' })).toHaveAttribute('title', 'Pause and return to the first step')
})

test('idle operations explain why playback is unavailable', () => {
  render(<Lesson idle />)
  expect(screen.getByRole('button', { name: 'Play' })).toBeDisabled()
  expect(screen.getByText('Ready. Apply an operation to enable playback.')).toBeVisible()
  expect(screen.getByRole('progressbar')).toHaveAttribute('value', '0')
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', 'Ready for an operation. Step 1 of 1.')
})
