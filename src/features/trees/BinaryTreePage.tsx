import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import StepControls from '../../components/StepControls'
import PseudocodePanel from '../../components/PseudocodePanel'
import { useStepPlayback } from '../../playback/useStepPlayback'
import { EXAMPLE_TREE_INPUT, MAX_TREE_NODES, parseTreeInput, type BinaryTree } from './treeModel'
import { traversalLabels, type TraversalKind } from './treeTraversals'
import { createTreeTrace } from './treeTrace'
import { treeCode } from './treeCode'
import TreeDiagram from './TreeDiagram'
import TreeMemory from './TreeMemory'
import TreeInfo from './TreeInfo'
import '../sorting/sorting.css'
import './trees.css'

export default function BinaryTreePage({ initialTree, initialInput, onTreeChange, typeSelector }: { initialTree?: BinaryTree; initialInput?: string; onTreeChange?: (tree: BinaryTree, input: string) => void; typeSelector?: ReactNode } = {}) {
  const [tree, setTree] = useState(() => initialTree ?? parseTreeInput(EXAMPLE_TREE_INPUT))
  const [input, setInput] = useState(initialInput ?? EXAMPLE_TREE_INPUT)
  const [traversal, setTraversal] = useState<TraversalKind>('preorder')
  const [error, setError] = useState('')
  const trace = useMemo(() => createTreeTrace(tree, traversal), [tree, traversal])
  const playback = useStepPlayback(trace.length)
  const step = trace[playback.index]
  const breadthFirst = traversal === 'level-order'
  function replaceTree(text: string) {
    try {
      const nextTree = parseTreeInput(text, tree.nextId)
      playback.reset()
      setTree(nextTree)
      onTreeChange?.(nextTree, text)
      setInput(text)
      setError('')
    } catch (failure) {
      // Invalid input preserves the exact preview and pauses it for inspection.
      playback.pause()
      setError(failure instanceof Error ? failure.message : 'Check your tree input.')
    }
  }
  function apply(event: FormEvent) { event.preventDefault(); replaceTree(input) }
  return <div className="sorting-page tree-page">
    <Link className="secondary-link" to="/"><span aria-hidden="true">←</span> Back to dashboard</Link>
    <header className="sorting-heading"><div><p className="eyebrow">TREES · FOLLOW THE BRANCHES</p><h1>Binary Tree</h1>
      <p>Enter a call. Explore a branch. Discover what it means to visit a node.</p></div><span className="lesson-tag">General binary tree · No ordering rules</span></header>
    {typeSelector}
    <div className="algorithm-selector"><label htmlFor="tree-traversal">Traversal</label>
      <select id="tree-traversal" value={traversal} onChange={(event) => { playback.reset(); setTraversal(event.target.value as TraversalKind) }}>
        {Object.entries(traversalLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
      </select><p>Switching traversal pauses playback, keeps your tree, and starts a fresh trace.</p>
    </div>
    <form className="lesson-panel array-input-panel tree-input" onSubmit={apply} noValidate>
      <h2>Build your tree</h2><label htmlFor="tree-input">Level-order values</label>
      <textarea id="tree-input" rows={2} value={input} onChange={(event) => setInput(event.target.value)} aria-invalid={!!error}
        aria-describedby={`tree-input-help${error ? ' tree-input-error' : ''}`} spellCheck={false} />
      <p id="tree-input-help">Start with ROOT. Then, for each non-NULL parent in queue order, give its left and right children.
        NULL takes a child slot but never becomes a parent. Missing final children mean NULL. Extra entries with no parent are rejected.
        For example, <code>1, null, 2, 3</code> makes 2 the right child of 1 and 3 the left child of 2.</p>
      <p>Up to {MAX_TREE_NODES} nodes, integers from −99 to 99. Duplicates are welcome. Use <code>null</code> or an empty input for an empty tree.</p>
      {error && <p id="tree-input-error" role="alert" className="input-error">{error} The previous tree and step are preserved; playback is paused.</p>}
      <div className="tree-input-actions"><button type="submit" className="step-button step-button-primary">Apply Tree</button>
        <button type="button" className="step-button" onClick={() => replaceTree(EXAMPLE_TREE_INPUT)}>Restore Example</button>
        <button type="button" className="step-button" onClick={() => replaceTree('')}>Clear Tree</button>
        <span>{Object.keys(tree.nodes).length} nodes · ROOT {tree.root ?? 'NULL'}</span></div>
    </form>
    <section className="lesson-panel tree-visual" aria-labelledby="tree-visual-title">
      <div className="lesson-panel-heading"><h2 id="tree-visual-title">Inside the binary tree</h2><span className="lesson-tag">{traversalLabels[traversal]}</span></div>
      <TreeDiagram step={step} breadthFirst={breadthFirst} />
      <div className="tree-console"><div>
        <div className="step-explanation" role="status" aria-live={playback.isPlaying ? 'off' : 'polite'} aria-atomic="true"><span className="eyebrow">{step.kind.toUpperCase()}</span><p>{step.explanation}</p></div>
        <div className="tree-output"><h3>Traversal output</h3><p aria-label="Traversal output">{step.output.length ? step.output.map((id) => tree.nodes[id]!.value).join(' → ') : 'No values visited yet'}</p>
          <p className="tree-output-ids" aria-label="Output node IDs">{step.output.length ? step.output.join(' → ') : 'Node IDs appear here as values are visited.'}</p></div>
      </div><StepControls index={playback.index} total={trace.length} canPrevious={playback.canPrevious} canNext={playback.canNext}
        canPlay={playback.canPlay} isPlaying={playback.isPlaying} isComplete={playback.isComplete} speed={playback.speed}
        onPrevious={playback.previous} onNext={playback.next} onPlay={playback.play} onPause={playback.pause}
        onReset={playback.reset} onSpeedChange={playback.setSpeed} /></div>
      <TreeMemory step={step} breadthFirst={breadthFirst} />
    </section>
    <div className="sorting-workspace tree-workspace"><PseudocodePanel lines={treeCode(traversal)} activeLineId={step.lineId} /><TreeInfo /></div>
    <p className="sorting-roadmap">Binary tree traversals are ready to explore. Use the tree type selector for BST operations and AVL balancing.</p>
  </div>
}
