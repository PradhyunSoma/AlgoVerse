import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import PseudocodePanel from '../../components/PseudocodePanel'
import StepControls from '../../components/StepControls'
import { useStepPlayback } from '../../playback/useStepPlayback'
import ArrayBars from './ArrayBars'
import ArrayInput from './ArrayInput'
import BubbleSortInfo from './BubbleSortInfo'
import { bubbleSortCode } from './bubbleSortCode'
import { createBubbleSortTrace } from './bubbleSortTrace'
import SelectionSortInfo from './SelectionSortInfo'
import { selectionSortCode } from './selectionSortCode'
import { createSelectionSortTrace } from './selectionSortTrace'
import InsertionSortInfo from './InsertionSortInfo'
import InsertionKey from './InsertionKey'
import { insertionSortCode } from './insertionSortCode'
import { createInsertionSortTrace } from './insertionSortTrace'
import MergeSortInfo from './MergeSortInfo'
import MergeRecursion from './MergeRecursion'
import MergeStorage from './MergeStorage'
import { mergeSortCode } from './mergeSortCode'
import { createMergeSortTrace } from './mergeSortTrace'
import QuickSortInfo from './QuickSortInfo'
import QuickRecursion from './QuickRecursion'
import QuickPartition from './QuickPartition'
import { quickSortCode } from './quickSortCode'
import { createQuickSortTrace } from './quickSortTrace'
import { barClass, barStates, quickMarkers } from './sortingPresentation'
import './sorting.css'
import './mergeSort.css'
import './quickSort.css'

const sample = [5, 1, 4, 2, 8] as const
const algorithms = {
  bubble: {
    title: 'Bubble Sort', description: 'Watch order take shape, one neighboring pair at a time.',
    tag: 'Early exit', createTrace: createBubbleSortTrace, code: bubbleSortCode, Info: BubbleSortInfo,
    legend: ['Ready', 'Compare', 'Swap', 'Sorted'],
  },
  selection: {
    title: 'Selection Sort', description: 'Find the smallest value. Give it a place. Repeat.',
    tag: 'Select the minimum', createTrace: createSelectionSortTrace, code: selectionSortCode, Info: SelectionSortInfo,
    legend: ['Ready', 'Scan', 'Minimum', 'Scan + min', 'Swap', 'Sorted'],
  },
  insertion: {
    title: 'Insertion Sort', description: 'Make room for the next key, one shift at a time.',
    tag: 'Stable insertion', createTrace: createInsertionSortTrace, code: insertionSortCode, Info: InsertionSortInfo,
    legend: ['Ready', 'Key', 'Compare', 'Shift', 'Vacant', 'Sorted'],
  },
  merge: {
    title: 'Merge Sort', description: 'Divide into smaller problems. Bring their answers together.',
    tag: 'Divide and conquer', createTrace: createMergeSortTrace, code: mergeSortCode, Info: MergeSortInfo,
    legend: ['Ready', 'Active', 'Left', 'Right', 'Compare', 'Selected', 'Destination', 'Merged', 'Sorted'],
  },
  quick: {
    title: 'Quick Sort', description: 'Place a pivot. Sort the two sides. Watch order emerge.',
    tag: 'Lomuto · Last-element pivot', createTrace: createQuickSortTrace, code: quickSortCode, Info: QuickSortInfo,
    legend: ['Pivot', 'Scan', 'Boundary', '≤ pivot', '> pivot', 'Unseen', 'Swap', 'Pivot placed', 'Sorted'],
  },
} as const
type Algorithm = keyof typeof algorithms

export default function SortingPage() {
  const [algorithm, setAlgorithm] = useState<Algorithm>('bubble')
  const [input, setInput] = useState<readonly number[]>(sample)
  const trace = useMemo(() => algorithms[algorithm].createTrace(input), [algorithm, input])
  const lesson = algorithms[algorithm]
  const playback = useStepPlayback(trace.length)
  const step = trace[playback.index]

  function applyArray(values: readonly number[]) {
    playback.reset()
    setInput([...values])
  }

  function selectAlgorithm(value: Algorithm) {
    playback.reset()
    setAlgorithm(value)
  }

  return (
    <div className="sorting-page">
      <Link className="secondary-link" to="/"><span aria-hidden="true">←</span> Back to dashboard</Link>
      <header className="sorting-heading">
        <div>
          <p className="eyebrow">SORTING ALGORITHMS · EXPLORE THE LOGIC</p>
          <h1>{lesson.title}</h1>
          <p>{lesson.description}</p>
        </div>
        <span className="lesson-tag">Ascending · {lesson.tag}</span>
      </header>
      <div className="algorithm-selector">
        <label htmlFor="sorting-algorithm">Algorithm</label>
        <select id="sorting-algorithm" value={algorithm}
          onChange={(event) => {
            const value = event.target.value
            if (value === 'bubble' || value === 'selection' || value === 'insertion' || value === 'merge' || value === 'quick') selectAlgorithm(value)
          }}
          aria-describedby="algorithm-help">
          {Object.entries(algorithms).map(([id, entry]) => <option key={id} value={id}>{entry.title}</option>)}
        </select>
        <p id="algorithm-help">Switching pauses playback and starts from your original array.</p>
      </div>
      <ArrayInput initialValues={sample} onApply={applyArray} onPause={playback.pause} />
      {'nodes' in step && <MergeRecursion step={step} original={input} />}
      {'calls' in step && <QuickRecursion step={step} original={input} />}
      <div className="sorting-workspace">
        <section className="lesson-panel array-panel" aria-labelledby="array-title">
          <div className="lesson-panel-heading">
            <h2 id="array-title">{'nodes' in step ? 'Working array' : 'Inside the array'}</h2>
            <span className="lesson-tag">Array · {step.values.length} {step.values.length === 1 ? 'value' : 'values'}</span>
          </div>
          <div className="array-legend" aria-label="Bar state legend">
            {lesson.legend.map((state) => <span key={state} className={barClass(state)}>{state}</span>)}
          </div>
          {'vacantIndex' in step && <InsertionKey step={step} />}
          {'calls' in step && <QuickPartition step={step} />}
          <ArrayBars values={step.values} states={barStates(step)} heldValue={'key' in step ? step.key : null}
            markers={'calls' in step ? quickMarkers(step) : undefined} />
          {'nodes' in step && <>
            <p className="merge-working-note">Merged means ordered within a completed range, not necessarily in final positions. Copy-back writes are shown individually.</p>
            <MergeStorage step={step} />
          </>}
          <dl className="execution-state" aria-label="Loop progress">
            {'nodes' in step ? <>
              <div><dt>Phase</dt><dd>{step.phase}</dd></div>
              <div><dt>Depth</dt><dd>{step.depth}</dd></div>
              <div><dt>Range · [lo, hi)</dt><dd>[{step.lo}, {step.hi})</dd></div>
              <div><dt>mid</dt><dd>{step.mid ?? '—'}</dd></div>
            </> : 'calls' in step ? <>
              <div><dt>low · first index</dt><dd>{step.low}</dd></div>
              <div><dt>high · last index</dt><dd>{step.high}</dd></div>
              <div><dt>i · boundary</dt><dd>{step.i ?? '—'}</dd></div>
              <div><dt>j · scan</dt><dd>{step.j ?? '—'}</dd></div>
            </> : <>
            <div><dt>Pass</dt><dd>{step.pass || '—'}</dd></div>
            {'sortedFrom' in step ? <>
              <div><dt>i · left index</dt><dd>{step.index ?? '—'}</dd></div>
              <div><dt>end · pass limit</dt><dd>{step.end}</dd></div>
              <div><dt>swapped</dt><dd>{String(step.swappedInPass)}</dd></div>
            </> : 'vacantIndex' in step ? <>
              <div><dt>i · key source</dt><dd>{step.kind === 'complete' ? '—' : step.outerIndex}</dd></div>
              <div><dt>j · looking left</dt><dd>{step.index ?? '—'}</dd></div>
              <div><dt>vacant · position</dt><dd>{step.vacantIndex ?? '—'}</dd></div>
            </> : <>
              <div><dt>start · pass position</dt><dd>{step.startIndex}</dd></div>
              <div><dt>scan · current index</dt><dd>{step.scanIndex ?? '—'}</dd></div>
              <div><dt>min · candidate index</dt><dd>{step.minimumIndex ?? '—'}</dd></div>
            </>}
            </>}
          </dl>
          <div className="step-explanation" role="status" aria-live="polite" aria-atomic="true">
            <span className="eyebrow">{step.kind === 'complete' ? 'COMPLETE' : `STEP ${playback.index + 1}`}</span>
            <p>{step.explanation}</p>
          </div>
          <StepControls index={playback.index} total={trace.length}
            canPrevious={playback.canPrevious} canNext={playback.canNext}
            canPlay={playback.canPlay} isPlaying={playback.isPlaying}
            isComplete={playback.isComplete} speed={playback.speed}
            onPrevious={playback.previous} onNext={playback.next}
            onPlay={playback.play} onPause={playback.pause}
            onReset={playback.reset} onSpeedChange={playback.setSpeed} />
          <p className="execution-counts">
            {step.comparisons} {step.comparisons === 1 ? 'comparison' : 'comparisons'}
            <span aria-hidden="true">·</span>
            {'bufferWrites' in step ? `${step.bufferWrites} buffer ${step.bufferWrites === 1 ? 'write' : 'writes'} · ${step.arrayWrites} array ${step.arrayWrites === 1 ? 'write' : 'writes'}`
              : 'shifts' in step
              ? `${step.shifts} ${step.shifts === 1 ? 'shift' : 'shifts'}`
              : `${step.swaps} ${step.swaps === 1 ? 'swap' : 'swaps'}`}
          </p>
        </section>
        <PseudocodePanel lines={lesson.code} activeLineId={step.lineId} />
      </div>
      <lesson.Info />
      <p className="sorting-roadmap">Explore all five sorting algorithms using the selector above.</p>
    </div>
  )
}
