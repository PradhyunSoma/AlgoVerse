import { playbackSpeeds, type PlaybackSpeed } from '../playback/useStepPlayback'

interface StepControlsProps {
  index: number
  total: number
  canPrevious: boolean
  canNext: boolean
  canPlay: boolean
  isPlaying: boolean
  isComplete: boolean
  isIdle?: boolean
  speed: PlaybackSpeed
  onPrevious: () => void
  onNext: () => void
  onPlay: () => void
  onPause: () => void
  onReset: () => void
  onSpeedChange: (speed: PlaybackSpeed) => void
}

export default function StepControls(props: StepControlsProps) {
  const { index, total, isPlaying, isComplete, isIdle = false } = props
  const progress = isIdle ? 0 : total > 1 ? index / (total - 1) * 100 : 100

  return (
    <div className="playback-toolbar" role="group" aria-label="Playback controls">
      <div className="playback-primary">
        <button className="step-button step-button-primary" disabled={!props.canPlay}
          onClick={isPlaying ? props.onPause : props.onPlay} type="button">
          {isPlaying ? 'Pause' : isComplete && !isIdle ? 'Replay' : 'Play'}
        </button>
        <button className="step-button" onClick={props.onReset} type="button">Reset</button>
        <label className="speed-control">
          Speed
          <select value={props.speed} onChange={(event) => props.onSpeedChange(Number(event.target.value) as PlaybackSpeed)}>
            {playbackSpeeds.map((speed) => <option key={speed.value} value={speed.value}>{speed.label}</option>)}
          </select>
        </label>
      </div>
      <div className="step-controls" role="group" aria-label="Step navigation">
        <button className="step-button" disabled={!props.canPrevious} onClick={props.onPrevious} type="button">
          <span aria-hidden="true">←</span> Previous Step
        </button>
        <span className="step-counter">Step <strong>{index + 1}</strong> of {total}</span>
        <button className="step-button" disabled={!props.canNext} onClick={props.onNext} type="button">
          Next Step <span aria-hidden="true">→</span>
        </button>
      </div>
      <progress className="playback-progress" aria-label="Execution progress" max={100} value={progress} />
      <p className="playback-hint">{isIdle ? 'Apply an operation to enable playback.' : isComplete ? 'Complete. Replay starts from the beginning.' : 'Next and Previous pause autoplay.'}</p>
    </div>
  )
}
