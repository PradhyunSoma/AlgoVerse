import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import StepControls from '../../../components/StepControls'
import PseudocodePanel from '../../../components/PseudocodePanel'
import { useStepPlayback } from '../../../playback/useStepPlayback'
import type { BinaryTree } from '../treeModel'
import { createTreeTrace, type TreeStep } from '../treeTrace'
import { traversalLabels, type TraversalKind } from '../treeTraversals'
import { treeCode } from '../treeCode'
import TreeDiagram from '../TreeDiagram'
import TreeMemory from '../TreeMemory'
import { BST_SAMPLE, bstValues, createBST, parseBSTValue } from './bstModel'
import { bstOperationLabels, type BSTOperationKind } from './bstContext'
import { bstDiagramStep, createBSTTrace, readyBSTTrace, type BSTStep } from './bstTrace'
import { layoutBSTSnapshot } from './bstLayout'
import { bstCode } from './bstCode'
import BSTInfo from './BSTInfo'
import '../../sorting/sorting.css'
import '../trees.css'
import './bst.css'

type Operation = BSTOperationKind | TraversalKind
const operations = { ...bstOperationLabels, ...traversalLabels }
const isTraversal = (kind: Operation): kind is TraversalKind => kind in traversalLabels
interface Lesson { saved: BinaryTree; trace: readonly (BSTStep | TreeStep)[]; committed: boolean }
export default function BSTPage({ initialTree, onSave, typeSelector }: { initialTree?: BinaryTree; onSave?: (tree: BinaryTree) => void; typeSelector?: ReactNode }) {
  const [kind, setKind] = useState<Operation>('insert')
  const [value, setValue] = useState('25')
  const [error, setError] = useState('')
  const [lesson, setLesson] = useState<Lesson>(() => {
    const saved = initialTree ?? createBST()
    return { saved, trace: readyBSTTrace(saved), committed: true }
  })
  const playback = useStepPlayback(lesson.trace.length)
  const step = lesson.trace[playback.index]
  const bstStep = 'outcome' in step ? step : null
  const forest = useMemo(() => bstStep ? layoutBSTSnapshot(bstStep.tree) : null, [bstStep])
  // Checkpoint once at completion; rewinding never applies or undoes a mutation.
  if (playback.isComplete && !lesson.committed) setLesson({ ...lesson, saved: step.tree, committed: true })
  useEffect(() => { onSave?.(lesson.saved) }, [lesson.saved, onSave])
  const needsValue = kind === 'insert' || kind === 'search' || kind === 'delete'
  function choose(next: Operation, saved = lesson.saved) {
    playback.reset(); setError(''); setKind(next)
    setLesson({ saved, trace: isTraversal(next) ? createTreeTrace(saved, next) : readyBSTTrace(saved), committed: true })
  }
  function apply(event: FormEvent) {
    event.preventDefault()
    if (playback.isPlaying) return
    try {
      const trace = isTraversal(kind) ? createTreeTrace(lesson.saved, kind)
        : createBSTTrace(lesson.saved, kind === 'minimum' || kind === 'maximum' ? { kind } : { kind, value: parseBSTValue(value) })
      playback.reset(); setError('')
      setLesson({ saved: lesson.saved, trace, committed: isTraversal(kind) })
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Check your input.') }
  }
  return <div className="sorting-page tree-page">
    <Link className="secondary-link" to="/"><span aria-hidden="true">←</span> Back to dashboard</Link>
    <header className="sorting-heading"><div><p className="eyebrow">TREES · LET ORDER GUIDE YOU</p><h1>Binary Search Tree</h1>
      <p>Compare a key. Choose a branch. Follow every pointer change.</p></div><span className="lesson-tag">Unique keys · No automatic balancing</span></header>
    {typeSelector}
    <form className="lesson-panel array-input-panel tree-input" onSubmit={apply} noValidate>
      <h2>Choose a BST operation</h2><div className="bst-inputs">
        <label>BST operation<select value={kind} onChange={(event) => choose(event.target.value as Operation)}>
          {Object.entries(operations).map(([id, title]) => <option key={id} value={id}>{title}</option>)}</select></label>
        {needsValue && <label>Value<input inputMode="numeric" value={value} disabled={playback.isPlaying} onChange={(event) => setValue(event.target.value)} aria-describedby="bst-limits" /></label>}
        <button type="submit" className="step-button step-button-primary" disabled={playback.isPlaying}>Apply Operation</button>
      </div><p id="bst-limits">Up to 15 nodes. Whole numbers from −99 to 99. Duplicate insertions are rejected. Clear the tree and insert values one at a time to build your own BST.</p>
      <p>Operations start from the saved BST. Finish a mutation to save it. Switching operations discards unfinished previews.
        Reset and Replay only replay history. Selecting a traversal prepares its trace; Apply restarts it.</p>
      {error && <p role="alert" className="input-error">{error} The saved tree and current visualization are unchanged.</p>}
      <div className="tree-input-actions"><button className="step-button" type="button" disabled={playback.isPlaying} onClick={() => choose(kind, createBST(BST_SAMPLE, lesson.saved.nextId))}>Reset to Sample BST</button>
        <button className="step-button" type="button" disabled={playback.isPlaying} onClick={() => choose(kind, createBST([], lesson.saved.nextId))}>Clear Tree</button></div>
      <p aria-label="Saved BST"><strong>Saved BST · inorder</strong> {bstValues(lesson.saved).join(' → ') || 'Empty'} · ROOT {lesson.saved.root ?? 'NULL'}</p>
    </form>
    <section className="lesson-panel tree-visual" aria-labelledby="bst-visual-title"><div className="lesson-panel-heading"><h2 id="bst-visual-title">Inside the BST</h2><span className="lesson-tag">{operations[kind]}</span></div>
      {bstStep && forest ? <><TreeDiagram step={bstDiagramStep(bstStep)} breadthFirst={false} bst={{ ...forest, step: bstStep }} />
        <p className="bst-snapshot-note">{bstStep.kind === 'complete' ? 'Completed operation · BST invariant validated.' : forest.detached.length ? `Pointer update in progress · ${forest.detached.length} node(s) are in locally held components. This is not a completed BST.` : 'Execution snapshot · follow the highlighted path and references.'}</p>
        {bstStep.pointer && <p className="bst-pointer-update" aria-label="Pointer update"><code>{bstStep.pointer.source}{bstStep.pointer.source === 'ROOT' ? '' : `.${bstStep.pointer.field}`}</code>: {bstStep.pointer.from ?? 'NULL'} → {bstStep.pointer.to ?? 'NULL'}</p>}
        <dl className="execution-state" aria-label="BST local references"><div><dt>ROOT</dt><dd>{step.tree.root ?? 'NULL'}</dd></div><div><dt>current</dt><dd>{step.current ?? 'NULL'}</dd></div>
          {Object.entries(bstStep.locals).map(([name, id]) => <div key={name}><dt>{name}</dt><dd>{id ?? 'NULL'}</dd></div>)}</dl>
      </> : <TreeDiagram step={step as TreeStep} breadthFirst={kind === 'level-order'} />}
      <div className="tree-console"><div><div className="step-explanation" role="status" aria-live="polite" aria-atomic="true"><span className="eyebrow">{step.kind.toUpperCase()}</span><p>{step.explanation}</p></div>
        {bstStep ? <div className="tree-output"><h3>Operation result</h3><p aria-label="Operation result">{bstStep.outcome === 'pending' || bstStep.outcome === 'ready' ? 'Follow the steps to see the result.' : `${bstStep.outcome}${bstStep.result === null ? '' : ` · ${step.tree.nodes[bstStep.result]!.value} (${bstStep.result})`}`}</p></div>
          : <div className="tree-output"><h3>Traversal output</h3><p aria-label="Traversal output">{(step as TreeStep).output.map((id) => step.tree.nodes[id]!.value).join(' → ') || 'No values visited yet'}</p></div>}
      </div><StepControls index={playback.index} total={lesson.trace.length} canPrevious={playback.canPrevious} canNext={playback.canNext}
        canPlay={playback.canPlay} isPlaying={playback.isPlaying} isComplete={playback.isComplete} isIdle={step.kind === 'ready'} speed={playback.speed}
        onPrevious={playback.previous} onNext={playback.next} onPlay={playback.play} onPause={playback.pause} onReset={playback.reset} onSpeedChange={playback.setSpeed} /></div>
      {!bstStep && <TreeMemory step={step as TreeStep} breadthFirst={kind === 'level-order'} />}
    </section>
    <div className="sorting-workspace tree-workspace"><PseudocodePanel lines={isTraversal(kind) ? treeCode(kind) : bstCode(kind)} activeLineId={step.lineId} /><BSTInfo /></div>
    <p className="sorting-roadmap">Use the tree type selector to compare this ordinary BST with an AVL tree that maintains balance.</p>
  </div>
}
