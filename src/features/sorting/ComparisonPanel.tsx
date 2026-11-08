import { memo } from 'react'
import ArrayBars from './ArrayBars'
import InsertionKey from './InsertionKey'
import MergeRecursion from './MergeRecursion'
import MergeStorage from './MergeStorage'
import QuickPartition from './QuickPartition'
import QuickRecursion from './QuickRecursion'
import { algorithms } from './sortingCatalog'
import { barClass, barStates, quickMarkers } from './sortingPresentation'
import type { ComparisonRun } from './comparison'
import ComparisonMetrics from './ComparisonMetrics'

function ComparisonPanel({ run, index, isPlaying }: { run: ComparisonRun; index: number; isPlaying: boolean }) {
  const step = run.trace[index], lesson = algorithms[run.algorithm]
  return <section className="comparison-panel lesson-panel" aria-label={`${lesson.title} comparison`} data-algorithm={run.algorithm} data-step={index}>
    <header className="lesson-panel-heading"><h2>{lesson.title}</h2><span className="lesson-tag">{step.kind === 'complete' ? 'Complete' : index === 0 ? 'Ready' : 'In progress'}</span></header>
    <p className="comparison-step">Step {index + 1} of {run.trace.length} · Recorded teaching steps</p>
    <progress aria-label={`${lesson.title} progress`} max={Math.max(1, run.trace.length - 1)} value={index} />
    <div className="array-legend" aria-label="Bar state legend">{lesson.legend.map(state => <span key={state} className={barClass(state)}>{state}</span>)}</div>
    {'vacantIndex' in step && <InsertionKey step={step} />}
    <ArrayBars values={step.values} states={barStates(step)} heldValue={'key' in step ? step.key : null} markers={'calls' in step ? quickMarkers(step) : undefined} />
    <div className="step-explanation" role="status" aria-live={isPlaying ? 'off' : 'polite'} aria-atomic="true"><span className="eyebrow">{step.kind}</span><p>{step.explanation}</p></div>
    <ComparisonMetrics metrics={step.metrics} />
    {'nodes' in step && <>
      <p className="merge-working-note">Working array and temporary storage are distinct. Merged ranges are ordered locally, not necessarily final.</p>
      <MergeStorage step={step} /><MergeRecursion step={step} original={run.original} />
    </>}
    {'calls' in step && <><QuickPartition step={step} /><QuickRecursion step={step} original={run.original} /></>}
  </section>
}

// Finished panels keep their snapshot while longer traces continue playing.
export default memo(ComparisonPanel)
