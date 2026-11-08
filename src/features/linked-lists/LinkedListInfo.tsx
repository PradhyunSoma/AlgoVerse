export default function LinkedListInfo() {
  return <section className="bubble-info lesson-panel" aria-labelledby="list-info-title">
    <div>
      <p className="eyebrow">UNDERSTAND THE CONNECTIONS</p>
      <h2 id="list-info-title">A sequence built from references.</h2>
      <p>A singly linked list stores <strong>data</strong> and a <strong>next reference</strong> in each node.
        HEAD points to the first node; NULL means no node. An empty list has HEAD = NULL.</p>
      <p>Unlike array elements, nodes do not need contiguous memory. The arrows define their order, not their screen positions.
        To access a position, start at HEAD and follow next references one by one.</p>
      <p>Insertion connects the new node to its successor <strong>before</strong> changing the incoming pointer.
        Deletion saves a reference to the target, bypasses it, then releases it. This preserves the rest of the chain.</p>
      <p>The diagram uses stable node IDs as reference names, not real memory addresses. Detached nodes are held by local
        newNode or target references until connected or released. Equal data values can belong to different nodes.</p>
    </div>
    <div className="complexity-notes">
      <h3>Time complexity · no tail pointer</h3>
      <dl>{[
        ['Access by position', 'O(n)'], ['Search / full traversal', 'O(n)'], ['Insert at beginning', 'O(1)'],
        ['Insert at end', 'O(n)'], ['Delete from beginning', 'O(1)'], ['Delete from end', 'O(n)'],
        ['Other position operations', 'O(n)'],
      ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      <p>Finding a predecessor can require a full walk. Once it is known, changing its next reference takes O(1).
        The list uses O(n) storage. These bounds describe standard list operations; copying, validation, and saved
        playback snapshots add work and memory in this teaching tool.</p>
    </div>
  </section>
}
