import type { QuickSortStep } from './quickSortTrace'

export default function QuickRecursion({ step, original }: { step: QuickSortStep; original: readonly number[] }) {
  const returned = step.calls.find((call) => call.id === step.lastReturned)
  return (
    <section className="quick-recursion lesson-panel" aria-labelledby="quick-recursion-title">
      <div className="lesson-panel-heading">
        <h2 id="quick-recursion-title">Partition, then recurse</h2>
        <span className="lesson-tag">Phase · {step.phase}</span>
      </div>
      <div className="quick-recursion-content">
        <p>Original input <code>[{original.join(', ')}]</code></p>
        <p>The parent waits while the left call finishes, then calls the right. Ranges [low, high] include both ends. low &gt; high means an empty call.</p>
        <div className="quick-stack-scroll" role="region" aria-label="Quick Sort call stack, scroll to inspect calls" tabIndex={0}>
          {step.stack.length === 0 ? <p>No active calls{step.kind === 'start' ? ' yet.' : '.'}</p> :
            <ol className="quick-stack" aria-label="Quick Sort call stack">
              {step.stack.map((id) => {
                const call = step.calls.find((entry) => entry.id === id)!
                const active = id === step.callId
                return <li key={id} data-call-id={id} data-active={active} data-status={call.status}
                  aria-label={`${active ? 'Active' : 'Waiting'} call [${call.low}, ${call.high}], ${call.status}`}>
                  <span className="quick-depth">Depth {call.depth}</span>
                  <strong>[{call.low}, {call.high}] {call.low > call.high ? '· Empty' : ''}</strong>
                  <span>{active ? 'Active · ' : ''}{call.status}</span>
                  <span>{call.finalPivot === null ? 'Pivot not placed yet' : `Final pivot at ${call.finalPivot}`}</span>
                </li>
              })}
            </ol>}
        </div>
        <p className="quick-returned">{returned ? `Last returned: [${returned.low}, ${returned.high}] → [${returned.result?.join(', ')}]`
          : 'No recursive calls have returned yet.'}</p>
      </div>
    </section>
  )
}
