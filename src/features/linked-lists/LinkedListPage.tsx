import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import PseudocodePanel from '../../components/PseudocodePanel'
import StepControls from '../../components/StepControls'
import { useStepPlayback } from '../../playback/useStepPlayback'
import { createList, listSummary, MAX_LIST_SIZE, type ListState } from './listModel'
import { operationLabels } from './listOperations'
import { createListTrace, readyListTrace, type ListStep } from './listTrace'
import { listCode } from './listCode'
import ListDiagram from './ListDiagram'
import LinkedListInfo from './LinkedListInfo'
import { createDoublyList, doublyNodes, toDoublyList, toSinglyList, type DoublyState } from './doublyListModel'
import { doublyOperationLabels, type DoublyOperation, type DoublyOperationKind } from './doublyListOperations'
import { createDoublyTrace, readyDoublyTrace, type DoublyStep } from './doublyListTrace'
import { doublyListCode } from './doublyListCode'
import DoublyDiagram from './DoublyDiagram'
import DoublyListInfo from './DoublyListInfo'
import { circularSummary, circularToSingly, createCircularList, isCircular, toCircularList, type CircularState } from './circularListModel'
import { createCircularTrace, readyCircularTrace, type CircularStep } from './circularListTrace'
import { circularListCode } from './circularListCode'
import CircularDiagram from './CircularDiagram'
import CircularListInfo from './CircularListInfo'
import '../sorting/sorting.css'
import './linkedList.css'

interface Lesson {
  saved: ListState | DoublyState | CircularState
  trace: readonly (ListStep | DoublyStep | CircularStep)[]
  committed: boolean
}

function integerInput(text: string, name: string) {
  if (!/^-?\d+$/.test(text.trim())) throw new RangeError(`${name} must be a whole number.`)
  return Number(text)
}

function operationTrace(saved: ListState | DoublyState | CircularState, operation: DoublyOperation) {
  if (isCircular(saved)) {
    if (operation.kind === 'traverse-backward') throw new Error('Circular singly linked lists only traverse forward.')
    return createCircularTrace(saved, operation)
  }
  if ('tail' in saved) return createDoublyTrace(saved, operation)
  if (operation.kind === 'traverse-backward') throw new Error('Backward traversal requires a doubly linked list.')
  return createListTrace(saved, operation)
}

function summary(state: ListState) {
  return isCircular(state) ? circularSummary(state) : listSummary(state)
}

export default function LinkedListPage() {
  const [kind, setKind] = useState<DoublyOperationKind>('traverse')
  const [value, setValue] = useState('15')
  const [position, setPosition] = useState('1')
  const [error, setError] = useState('')
  const [lesson, setLesson] = useState<Lesson>(() => {
    const saved = createList()
    return { saved, trace: readyListTrace(saved), committed: true }
  })
  const playback = useStepPlayback(lesson.trace.length)
  const step = lesson.trace[playback.index]
  const circular = isCircular(lesson.saved)
  const doubly = !circular && 'tail' in lesson.saved
  const size = Object.keys(lesson.saved.nodes).length
  const createCurrentList = circular ? createCircularList : doubly ? createDoublyList : createList
  const labels = doubly ? doublyOperationLabels : operationLabels
  const inserting = kind.startsWith('insert')
  const atPosition = kind.endsWith('position')
  // A guarded state transition commits exactly once when either manual or timed playback finishes.
  // Rewinding/replaying keeps this checkpoint; it never applies an insertion or deletion twice.
  if (playback.isComplete && !lesson.committed) {
    setLesson({ ...lesson, saved: step.state, committed: true })
  }

  function replaceList(saved: ListState | DoublyState | CircularState) {
    playback.reset()
    setError('')
    setLesson({ saved, trace: isCircular(saved) ? readyCircularTrace(saved) : 'tail' in saved ? readyDoublyTrace(saved) : readyListTrace(saved), committed: true })
  }

  function apply(event: FormEvent) {
    event.preventDefault()
    if (playback.isPlaying) return
    try {
      const data = inserting ? integerInput(value, 'Value') : 0
      const index = atPosition ? integerInput(position, 'Position') : 0
      const operation: DoublyOperation = kind === 'insert-position' ? { kind, value: data, position: index }
        : kind === 'insert-start' || kind === 'insert-end' ? { kind, value: data }
        : kind === 'delete-position' ? { kind, position: index } : { kind }
      const trace = operationTrace(lesson.saved, operation)
      playback.reset()
      setLesson({ saved: lesson.saved, trace, committed: false })
      setError('')
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Please check your input.')
    }
  }

  return <div className="sorting-page linked-list-page">
    <Link className="secondary-link" to="/"><span aria-hidden="true">←</span> Back to dashboard</Link>
    <header className="sorting-heading">
      <div><p className="eyebrow">LINKED LISTS · FOLLOW THE REFERENCES</p><h1>{circular ? 'Circular Singly' : doubly ? 'Doubly' : 'Singly'} Linked List</h1>
        <p>Connect a node. Follow a pointer. See the whole chain change.</p></div>
      <span className="lesson-tag">{circular ? 'One direction · TAIL loops to HEAD' : doubly ? 'Two directions · HEAD and TAIL' : 'One direction · No tail pointer'}</span>
    </header>
    <div className="algorithm-selector">
      <label htmlFor="list-type">List type</label>
      <select id="list-type" value={circular ? 'circular' : doubly ? 'doubly' : 'singly'} aria-describedby="list-type-help" onChange={(event) => {
        setKind('traverse')
        const linear = isCircular(lesson.saved) ? circularToSingly(lesson.saved)
          : 'tail' in lesson.saved ? toSinglyList(lesson.saved) : lesson.saved
        replaceList(event.target.value === 'circular' ? toCircularList(linear)
          : event.target.value === 'doubly' ? toDoublyList(linear) : linear)
      }}><option value="singly">Singly Linked List</option><option value="doubly">Doubly Linked List</option><option value="circular">Circular Singly Linked List</option></select>
      <p id="list-type-help">Switching pauses playback and keeps the last saved values and node IDs. Unfinished previews are discarded. Switching to circular closes TAIL.next at HEAD; switching away opens that link.</p>
    </div>
    <form className="lesson-panel array-input-panel list-operation-form" onSubmit={apply} noValidate>
      <h2>Choose an operation</h2>
      <div className="list-inputs">
        <label>Operation<select value={kind} aria-describedby="list-operation-help" onChange={(event) => {
          setKind(event.target.value as DoublyOperationKind)
          replaceList(lesson.saved)
        }}>{Object.entries(labels).map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select></label>
        {inserting && <label>Value<input inputMode="numeric" value={value} disabled={playback.isPlaying}
          onChange={(event) => setValue(event.target.value)} aria-describedby="list-limits" /></label>}
        {atPosition && <label>Position<input inputMode="numeric" value={position} disabled={playback.isPlaying}
          onChange={(event) => setPosition(event.target.value)} aria-describedby="list-position-help" /></label>}
        <button className="step-button step-button-primary" type="submit" disabled={playback.isPlaying}>Apply Operation</button>
      </div>
      <p id="list-limits">Up to {MAX_LIST_SIZE} nodes. Integer values from −99 to 99; duplicates are welcome.</p>
      <p id="list-position-help">Positions start at 0. Insert: 0–{size}.
        Delete: {size ? `0–${size - 1}` : 'no valid positions in an empty list'}.</p>
      <p id="list-operation-help">Apply uses the saved list below. Finish an operation to save its result.
        Switching operations pauses playback and discards an unfinished preview. Reset and Replay only replay history.</p>
      {error && <p role="alert" className="input-error">{error} The previous visualization is unchanged.</p>}
      <div className="list-maintenance">
        <button type="button" className="step-button" disabled={playback.isPlaying} onClick={() => replaceList(createCurrentList([], lesson.saved.nextId))}>Clear List</button>
        <button type="button" className="step-button" disabled={playback.isPlaying} onClick={() => replaceList(createCurrentList([10, 20, 30], lesson.saved.nextId))}>Restore Example</button>
        <p aria-label="Saved list"><strong>Saved list</strong> {summary(lesson.saved)}</p>
      </div>
    </form>
    <section className="lesson-panel list-visual-panel" aria-labelledby="list-visual-title">
      <div className="lesson-panel-heading"><h2 id="list-visual-title">Inside the linked list</h2>
        <span className="lesson-tag">{doublyOperationLabels[kind] === 'Traverse forward' && !doubly ? 'Traverse' : doublyOperationLabels[kind]}</span></div>
      {'type' in step ? step.type === 'circular' ? <CircularDiagram step={step} /> : <DoublyDiagram step={step} /> : <ListDiagram step={step} />}
      <div className="list-console">
        <div className="list-context">
        <p className="list-current-summary" aria-label="Current list"><strong>From HEAD</strong> {summary(step.state)}</p>
        {'type' in step && step.type === 'doubly' && <p className="list-current-summary" aria-label="Backward list"><strong>From TAIL</strong> {[...doublyNodes(step.state, 'prev').map((node) => node.value), 'NULL'].join(' → ')}</p>}
        <dl className="execution-state" aria-label="Local references">
          <div><dt>HEAD</dt><dd>{step.state.head ?? 'NULL'}</dd></div>
          <div><dt>current</dt><dd>{step.current ?? 'NULL'}</dd></div>
          {'type' in step && step.type === 'doubly' ? <>
            <div><dt>TAIL</dt><dd>{step.state.tail ?? 'NULL'}</dd></div>
            <div><dt>left neighbor</dt><dd>{step.left ?? 'NULL'}</dd></div>
            <div><dt>right neighbor</dt><dd>{step.right ?? 'NULL'}</dd></div>
          </> : <>
            <div><dt>previous</dt><dd>{step.previous ?? 'NULL'}</dd></div>
            {'type' in step && step.type === 'circular' && <>
              <div><dt>TAIL</dt><dd>{step.state.tail ?? 'NULL'}</dd></div>
              <div><dt>successor</dt><dd>{step.successor ?? 'NULL'}</dd></div>
            </>}
          </>}
          <div><dt>{step.newId ? 'newNode' : 'target'}</dt><dd>{step.held ?? 'NULL'}</dd></div>
        </dl>
        <div className="step-explanation" role="status" aria-live={playback.isPlaying ? 'off' : 'polite'} aria-atomic="true"><span className="eyebrow">{step.kind.toUpperCase()}</span><p>{step.explanation}</p></div>
        {kind.startsWith('traverse') && <p className="list-traversal" aria-label="Traversal sequence"><strong>Read so far</strong> {step.visited.length ? step.visited.join(' → ') : 'No values read yet'}</p>}
        </div>
        <StepControls index={playback.index} total={lesson.trace.length} canPrevious={playback.canPrevious} canNext={playback.canNext}
          canPlay={playback.canPlay} isPlaying={playback.isPlaying} isComplete={playback.isComplete} isIdle={step.kind === 'ready'} speed={playback.speed}
          onPrevious={playback.previous} onNext={playback.next} onPlay={playback.play} onPause={playback.pause}
          onReset={playback.reset} onSpeedChange={playback.setSpeed} />
      </div>
    </section>
    <div className="sorting-workspace list-workspace">
      <PseudocodePanel lines={circular ? circularListCode(kind === 'traverse-backward' ? 'traverse' : kind) : doubly ? doublyListCode(kind) : listCode(kind === 'traverse-backward' ? 'traverse' : kind)} activeLineId={step.lineId} />
      {circular ? <CircularListInfo /> : doubly ? <DoublyListInfo /> : <LinkedListInfo />}
    </div>
    <p className="sorting-roadmap">Explore singly, doubly, and circular singly linked lists using the selector above.</p>
  </div>
}
