import type { TreeStep } from './treeTrace'
export default function TreeMemory({ step, breadthFirst }: { step: TreeStep; breadthFirst: boolean }) {
  const label = (id: keyof typeof step.tree.nodes | null) => id === null ? 'NULL' : `${step.tree.nodes[id]!.value} (${id})`
  return <section className="tree-memory" aria-labelledby="tree-memory-title">
    <h3 id="tree-memory-title">{breadthFirst ? 'Queue · front → back' : 'Call stack · bottom → top'}</h3>
    {breadthFirst ? <>
      <p>Dequeue from the front. Enqueue children at the back, left before right.</p>
      <ol tabIndex={0} aria-label="BFS queue">{step.queue.map((id, index) => <li key={id} data-queued-id={id}>{index === 0 ? 'Front · ' : ''}{label(id)}</li>)}</ol>
      {!step.queue.length && <p>Queue is empty.</p>}
    </> : <>
      <p>Each entry is a recursive call. Entering a call does not add its value to the output. A NULL call immediately returns.</p>
      <ol tabIndex={0} aria-label="Recursion call stack">{step.stack.map((frame, index) => <li key={frame.callId} data-call-id={frame.callId}>
        <code>{frame.callId}</code><span>{label(frame.nodeId)} · {frame.via}{index === step.stack.length - 1 ? ' · Top' : ' · Waiting'}</span>
      </li>)}</ol>
      {!step.stack.length && <p>Call stack is empty.</p>}
    </>}
  </section>
}
