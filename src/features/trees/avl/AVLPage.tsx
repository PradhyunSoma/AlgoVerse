import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import StepControls from '../../../components/StepControls'
import PseudocodePanel from '../../../components/PseudocodePanel'
import { useStepPlayback } from '../../../playback/useStepPlayback'
import { bstOperationLabels, type BSTOperationKind } from '../bst/bstContext'
import { bstValues, parseBSTValue } from '../bst/bstModel'
import { traversalLabels, type TraversalKind } from '../treeTraversals'
import { treeCode } from '../treeCode'
import TreeMemory from '../TreeMemory'
import { AVL_SAMPLE, rotationPresets, type AVLTree, type RotationCase } from './avlModel'
import { createAVL } from './avlOperations'
import { createAVLTrace, createAVLTraversal, readyAVLTrace, type AVLStep, type AVLTraversalStep } from './avlTrace'
import { avlCode } from './avlCode'
import AVLDiagram from './AVLDiagram'
import AVLRotationPanel from './AVLRotationPanel'
import AVLInfo from './AVLInfo'
import '../../sorting/sorting.css'
import '../trees.css'
import '../bst/bst.css'
import './avl.css'

type Operation = BSTOperationKind | TraversalKind
const operations = { ...bstOperationLabels, ...traversalLabels }
const isTraversal = (kind: Operation): kind is TraversalKind => kind in traversalLabels
interface Lesson { saved: AVLTree; trace: readonly (AVLStep | AVLTraversalStep)[]; committed: boolean }
export default function AVLPage({ initialTree, onSave, typeSelector }: { initialTree?: AVLTree; onSave?: (tree: AVLTree) => void; typeSelector?: ReactNode }) {
  const [kind, setKind] = useState<Operation>('insert')
  const [value, setValue] = useState('25')
  const [error, setError] = useState('')
  const [example, setExample] = useState('')
  const [lesson, setLesson] = useState<Lesson>(() => {
    const saved = initialTree ?? createAVL()
    return { saved, trace: readyAVLTrace(saved), committed: true }
  })
  const playback = useStepPlayback(lesson.trace.length)
  const step = lesson.trace[playback.index]
  const operationStep = 'outcome' in step ? step : null
  if (playback.isComplete && !lesson.committed) setLesson({ ...lesson, saved: step.tree, committed: true })
  useEffect(() => { onSave?.(lesson.saved) }, [lesson.saved, onSave])
  const needsValue = kind === 'insert' || kind === 'delete' || kind === 'search'
  function choose(next: Operation, saved = lesson.saved) {
    playback.reset(); setError(''); setExample(''); setKind(next)
    setLesson({ saved, trace: isTraversal(next) ? createAVLTraversal(saved, next) : readyAVLTrace(saved), committed: true })
  }
  function apply(event: FormEvent) {
    event.preventDefault()
    if (playback.isPlaying) return
    try {
      const trace = isTraversal(kind) ? createAVLTraversal(lesson.saved, kind) : createAVLTrace(lesson.saved,
        kind === 'minimum' || kind === 'maximum' ? { kind } : { kind, value: parseBSTValue(value) })
      playback.reset(); setError(''); setExample('')
      setLesson({ saved: lesson.saved, trace, committed: isTraversal(kind) })
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Check your input.') }
  }
  function demonstrate(which: RotationCase) {
    const values = rotationPresets[which]
    const saved = createAVL(values.slice(0, 2), lesson.saved.nextId)
    const trace = createAVLTrace(saved, { kind: 'insert', value: values[2] })
    playback.reset(); setError(''); setKind('insert'); setValue(String(values[2]))
    setExample(`${which}: built ${values[0]} → ${values[1]} with real AVL insertions. Next or Play inserts ${values[2]} and shows the resulting rotation${which === 'LR' || which === 'RL' ? 's' : ''}.`)
    setLesson({ saved, trace, committed: false })
  }
  return <div className="sorting-page tree-page avl-page">
    <Link className="secondary-link" to="/"><span aria-hidden="true">←</span> Back to dashboard</Link>
    <header className="sorting-heading"><div><p className="eyebrow">TREES · KEEP YOUR BALANCE</p><h1>AVL Tree</h1><p>Follow the heights. Find the imbalance. Watch the rotation.</p></div><span className="lesson-tag">Self-balancing BST · Unique keys</span></header>
    {typeSelector}
    <form className="lesson-panel array-input-panel tree-input" onSubmit={apply} noValidate>
      <h2>Choose an AVL operation</h2><div className="bst-inputs"><label>AVL operation<select value={kind} onChange={(event) => choose(event.target.value as Operation)}>
        {Object.entries(operations).map(([id, title]) => <option value={id} key={id}>{title}</option>)}</select></label>
        {needsValue && <label>Value<input inputMode="numeric" value={value} disabled={playback.isPlaying} onChange={(event) => setValue(event.target.value)} aria-describedby="avl-limits" /></label>}
        <button className="step-button step-button-primary" type="submit" disabled={playback.isPlaying}>{needsValue ? operations[kind] : 'Apply Operation'}</button></div>
      <p id="avl-limits">Up to 15 nodes. Whole numbers −99 to 99. Duplicate insertions are rejected. Clear Tree and insert values one at a time to build your own AVL tree.</p>
      <p>Finish a mutation to save it. New operations use the saved AVL tree. Reset and Replay inspect history without applying a mutation twice. Switching operations discards unfinished previews. Selecting a traversal prepares its trace.</p>
      {error && <p role="alert" className="input-error">{error} The saved tree and current visualization are unchanged.</p>}
      <div className="tree-input-actions"><button className="step-button" type="button" disabled={playback.isPlaying} onClick={() => choose(kind, createAVL(AVL_SAMPLE, lesson.saved.nextId))}>Restore Sample AVL</button>
        <button className="step-button" type="button" disabled={playback.isPlaying} onClick={() => choose(kind, createAVL([], lesson.saved.nextId))}>Clear Tree</button></div>
      <fieldset className="avl-presets"><legend>Try a rotation</legend><p>Each example replaces the saved AVL with its first two values and prepares insertion of the third. Press Next or Play.</p>
        <div className="tree-input-actions">{(Object.keys(rotationPresets) as RotationCase[]).map((which) => <button key={which} className="step-button" type="button" disabled={playback.isPlaying} onClick={() => demonstrate(which)}>{which}: {rotationPresets[which].join(', ')}</button>)}</div>
      </fieldset>
      {example && <p className="avl-example" aria-label="Rotation example">{example}</p>}
      <p aria-label="Saved AVL"><strong>Saved AVL · inorder</strong> {bstValues(lesson.saved).join(' → ') || 'Empty'} · ROOT {lesson.saved.root ?? 'NULL'}</p>
    </form>
    <section className="lesson-panel tree-visual" aria-labelledby="avl-visual-title"><div className="lesson-panel-heading"><h2 id="avl-visual-title">Inside the AVL tree</h2><span className="lesson-tag">{operations[kind]}</span></div>
      <AVLDiagram step={step} breadthFirst={kind === 'level-order'} />
      {operationStep && <AVLRotationPanel step={operationStep} />}
      <div className="tree-console"><div><div className="step-explanation" role="status" aria-live="polite" aria-atomic="true"><span className="eyebrow">{step.kind.toUpperCase()}</span><p>{step.explanation}</p></div>
        <div className="tree-output"><h3>{operationStep ? 'Operation result' : 'Traversal output'}</h3><p aria-label={operationStep ? 'Operation result' : 'Traversal output'}>
          {operationStep ? step.kind !== 'complete' ? 'Follow the steps; the saved AVL changes only at completion.' : `${operationStep.outcome}${operationStep.result === null ? '' : ` · ${step.tree.nodes[operationStep.result]!.value} (${operationStep.result})`}`
            : (step as AVLTraversalStep).output.map((id) => step.tree.nodes[id]!.value).join(' → ') || 'No values visited yet'}</p></div>
      </div><StepControls index={playback.index} total={lesson.trace.length} canPrevious={playback.canPrevious} canNext={playback.canNext}
        canPlay={playback.canPlay} isPlaying={playback.isPlaying} isComplete={playback.isComplete} isIdle={step.kind === 'ready'} speed={playback.speed}
        onPrevious={playback.previous} onNext={playback.next} onPlay={playback.play} onPause={playback.pause} onReset={playback.reset} onSpeedChange={playback.setSpeed} /></div>
      {!operationStep && <TreeMemory step={step as AVLTraversalStep} breadthFirst={kind === 'level-order'} />}
    </section>
    <div className="sorting-workspace tree-workspace"><PseudocodePanel lines={isTraversal(kind) ? treeCode(kind) : avlCode(kind)} activeLineId={step.lineId} /><AVLInfo /></div>
  </div>
}
