import type { AVLStep } from './avlTrace'

export default function AVLRotationPanel({ step }: { step: AVLStep }) {
  const label = (id: string | null) => id ?? 'NULL'
  return <div className="avl-rotation-panel" aria-label="AVL balancing state">
    <h3>{step.rotation ? `${step.rotation.direction === 'left' ? 'Left' : 'Right'} rotation · ${step.rotation.part}` : step.imbalance ? `${step.imbalance.case} case detected` : 'Height and balance checks'}</h3>
    {step.imbalance && <p>Detected at {step.imbalance.node}: BF {step.imbalance.balance}; child {step.imbalance.child}: BF {step.imbalance.childBalance}.
      Grandchild: {label(step.imbalance.grandchild)}. These are the values at case selection.</p>}
    {step.rotation && <dl className="execution-state"><div><dt>Old subtree root</dt><dd>{step.rotation.root}</dd></div><div><dt>Pivot / new root</dt><dd>{step.rotation.pivot}</dd></div>
      <div><dt>Moved middle subtree</dt><dd>{label(step.rotation.transfer)}</dd></div><div><dt>Parent connection</dt><dd>{step.rotation.parent ?? 'ROOT reference'}</dd></div></dl>}
    {step.heightUpdate && <p aria-label="Height update">{step.heightUpdate.id}: stored height {step.heightUpdate.from} → {step.heightUpdate.to}.</p>}
    {step.pointer && <p className="bst-pointer-update" aria-label="Pointer update">{step.pointer.source}{step.pointer.source === 'ROOT' ? '' : `.${step.pointer.field}`}: {label(step.pointer.from)} → {label(step.pointer.to)}</p>}
    <dl className="execution-state" aria-label="AVL local references"><div><dt>ROOT</dt><dd>{label(step.tree.root)}</dd></div><div><dt>Current</dt><dd>{label(step.current)}</dd></div>
      {Object.entries(step.locals).map(([name, id]) => <div key={name}><dt>{name}</dt><dd>{label(id)}</dd></div>)}</dl>
    <p aria-label="Ancestor path">Affected path before this repair · root to deepest: {step.ancestors.join(' → ') || 'No pending ancestor checks'}</p>
    <p>{step.kind === 'complete' ? 'Completed operation: BST ordering, heights, and AVL balance validated.' : step.kind === 'ready' ? 'Saved AVL tree is balanced. Apply an operation to begin.' : 'Operation in progress. Pointer changes and height repairs are not committed until the final step.'}</p>
  </div>
}
