import type { DFSStep } from './dfsTrace'
export default function DFSStack({ step }: { step: DFSStep }) {
  const label = (id: string) => step.graph.vertices.find(v => v.id === id)!.label
  return <section className="graph-stack" aria-labelledby="dfs-stack-title"><h3 id="dfs-stack-title">Recursion stack · bottom → top</h3>
    <p>Each frame is one live DFS call. The top call executes; earlier calls wait for it to return. Entering is shown just before the first instruction marks discovery.</p>
    <ol tabIndex={0} aria-label="DFS recursion stack">{step.stack.map((frame, index) => <li key={frame.vertex} data-frame-id={frame.vertex} data-top={index === step.stack.length - 1} data-returning={step.kind === 'return' && index === step.stack.length - 1}>
      <span><strong>DFS({label(frame.vertex)})</strong> <span>{index === 0 ? 'Bottom · ' : ''}{index === step.stack.length - 1 ? step.kind === 'return' ? 'Top · Returning' : 'Top · Executing' : 'Waiting'}</span></span>
      <small>{frame.parent ? `Called by ${label(frame.parent)}` : 'Called by traversal driver'}</small>
    </li>)}</ol>
    {!step.stack.length && <p>Stack is empty.</p>}
    <p aria-label="DFS current call">Current call: {step.active ? `DFS(${label(step.active)})` : 'none'}</p>
    {step.returned && <p className="graph-return-note">↩ {label(step.returned.vertex)} has exited.{step.returned.caller ? ` Control returns to ${label(step.returned.caller)}. The completed frame is no longer on the stack.` : ' Control returns to the traversal driver.'}</p>}
  </section>
}
