import ComplexityPanel from '../../components/ComplexityPanel'
import { listComplexity } from './complexity'

export default function CircularListInfo() {
  return <section className="bubble-info lesson-panel" aria-labelledby="circular-info-title">
    <div><p className="eyebrow">ONE DIRECTION · ONE COMPLETE LAP</p>
      <h2 id="circular-info-title">The end leads back to the beginning.</h2>
      <p>A circular singly linked list stores data and one next reference in each node. Unlike a standard singly linked list,
        the last node points to HEAD instead of NULL. HEAD identifies the first node; TAIL identifies the last.
        A single node points to itself. An empty list has both HEAD and TAIL set to NULL.</p>
      <p>Traversal starts at HEAD, reads each value, and follows next. Stop when current returns to HEAD;
        waiting for NULL would loop forever. The displayed traversal reads HEAD only once.
        Round-robin scheduling uses this idea to repeatedly give each participant a turn.</p>
      <p>Insertion connects the new node to its successor before redirecting the predecessor. Deletion holds the target locally,
        bypasses it, clears its next reference, and releases it. Changing the first or last node also requires updating HEAD or TAIL
        so that TAIL.next points to HEAD again.</p>
      <p>Each pointer assignment is shown separately. During an operation, an endpoint may temporarily lag behind a changed link.
        The diagram shows those actual references, including detached nodes held locally, rather than pretending every intermediate state is already complete.</p>
      <p>Stable node IDs identify references, not array positions. Nodes do not need contiguous memory. Switching list types keeps the last saved values
        and IDs, opens or closes the last link as appropriate, and discards unfinished previews.</p>
    </div>
    <ComplexityPanel profile={listComplexity.circular} />
    </section>
}
