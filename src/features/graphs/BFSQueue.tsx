import type { BFSStep } from './bfsTrace'
export default function BFSQueue({ step }: { step: BFSStep }) {
  return <section className="graph-queue" aria-labelledby="graph-queue-title"><h3 id="graph-queue-title">Queue · first in, first out</h3>
    <p>Remove at the front. Add at the rear. Discovered vertices are marked before enqueueing; each enters this queue only once.</p>
    <ol aria-label="BFS queue">{step.queue.map((id, i) => <li key={id} data-queued-id={id}><strong>{step.graph.vertices.find(v => v.id === id)!.label}</strong><span>{i === 0 ? 'Front' : ''}{i === 0 && i === step.queue.length - 1 ? ' · ' : ''}{i === step.queue.length - 1 ? 'Rear' : ''}</span></li>)}</ol>
    {!step.queue.length && <p>Queue is empty.</p>}
    <p className="graph-queue-action">{step.kind === 'enqueue' || step.kind === 'start-enqueue' ? '↑ Enqueued at the rear' : step.kind === 'dequeue' ? '↓ Dequeued from the front' : 'Queue contents match this exact step.'}</p>
  </section>
}
