import ComplexityPanel from '../../components/ComplexityPanel'
import { listComplexity } from './complexity'

export default function DoublyListInfo() {
  return <section className="bubble-info lesson-panel" aria-labelledby="doubly-info-title">
    <div>
      <p className="eyebrow">TWO DIRECTIONS · ONE CONNECTED LIST</p>
      <h2 id="doubly-info-title">A way forward. A way back.</h2>
      <p>Each node stores data and two references: <strong>prev</strong> points to its predecessor and <strong>next</strong> points to its successor.
        HEAD identifies the first node and TAIL identifies the last. The first prev and last next are NULL; both endpoints are NULL in an empty list.</p>
      <p>A singly linked list can only follow next. A doubly linked list can also start at TAIL and follow prev in reverse.
        Nodes still do not need contiguous memory. Stable IDs name the references; they are not array positions or memory addresses.</p>
      <p>Insertion first sets the new node’s prev and next, then updates its neighbors. Deletion reconnects both neighbors,
        updates HEAD or TAIL when necessary, clears the target’s links, and releases it. Each write is a separate step:
        the two directions may briefly disagree before the final reciprocal links are restored.</p>
      <p>Keeping an extra reference per node and a TAIL reference uses more memory than a singly linked list, while total list storage remains O(n).
        TAIL and prev let us insert or delete at the end without walking from HEAD.</p>
    </div>
    <ComplexityPanel profile={listComplexity.doubly} />
    </section>
}
