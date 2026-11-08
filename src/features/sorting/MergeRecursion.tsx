import type { MergeSortStep } from './mergeSortTrace'

export default function MergeRecursion({ step, original }: { step: MergeSortStep; original: readonly number[] }) {
  const columns = Math.max(original.length, 1)
  const rows = Math.max(1, ...step.nodes.map((node) => node.depth + 1))
  function center(lo: number, hi: number) { return (lo + Math.max(hi, lo + 1)) / 2 * 84 }
  return (
    <section className="merge-recursion lesson-panel" aria-labelledby="recursion-title">
      <div className="lesson-panel-heading">
        <h2 id="recursion-title">Divide, then merge</h2>
        <span className="lesson-tag">Phase · {step.phase}</span>
      </div>
      <div className="merge-recursion-intro">
        <p>Original input <code aria-label="Original input">[{original.join(', ')}]</code></p>
        <p>Each card is one recursive call. Only entered calls appear; one call runs at a time. In is its input, Out is its completed result. Ranges [lo, hi) exclude hi.</p>
        <p className="merge-stack">Call stack · {step.stack.length ? step.stack.map((id) => {
          const node = step.nodes.find((entry) => entry.id === id)!
          return `[${node.lo}, ${node.hi})`
        }).join(' → ') : 'No active calls'}</p>
      </div>
      <div className="merge-tree-scroll" role="region" aria-label="Recursion tree, scroll to inspect calls" tabIndex={0}>
        {step.nodes.length === 0 ? <p className="merge-tree-empty">Ready to enter the root call.</p> :
          <div className="merge-tree" style={{ minWidth: columns * 84, height: rows * 114 }}>
            <svg className="merge-edges" viewBox={`0 0 ${columns * 84} ${rows * 114}`} preserveAspectRatio="none" aria-hidden="true">
              {step.nodes.filter((node) => node.parentId !== null).map((node) => {
                const parent = step.nodes.find((entry) => entry.id === node.parentId)!
                return <path key={node.id} d={`M ${center(parent.lo, parent.hi)} ${parent.depth * 114 + 100} L ${center(node.lo, node.hi)} ${node.depth * 114 + 6}`} />
              })}
            </svg>
            <ol className="merge-nodes" aria-label="Recursive calls"
              style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
              {step.nodes.map((node) => {
                const active = node.id === step.nodeId && step.kind !== 'complete'
                return <li key={node.id} className="merge-node" data-node-id={node.id} data-active={active}
                  data-status={node.status} aria-label={`${active ? 'Active: ' : ''}sort [${node.lo}, ${node.hi}), ${node.status}`}
                  style={{ gridColumn: `${node.lo + 1} / span ${Math.max(node.hi - node.lo, 1)}`, gridRow: node.depth + 1 }}>
                  <strong>[{node.lo}, {node.hi}) {active && <span>· Active</span>}</strong>
                  <span className="merge-node-status">{node.status}</span>
                  <span className="merge-node-values">In [{node.input.join(', ')}]</span>
                  <span className="merge-node-values">Out {node.result === null ? '—' : `[${node.result.join(', ')}]`}</span>
                </li>
              })}
            </ol>
          </div>}
      </div>
      <p className="merge-tree-caption">Returned nodes retain their historical result. The highlighted card identifies the current call. Scroll inside the tree for larger inputs.</p>
    </section>
  )
}
