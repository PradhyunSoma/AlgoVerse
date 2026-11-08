export default function MergeSortInfo() {
  return (
    <section className="bubble-info lesson-panel" aria-labelledby="merge-info-title">
      <div>
        <p className="eyebrow">UNDERSTAND THE ALGORITHM</p>
        <h2 id="merge-info-title">Why does it work?</h2>
        <p>Merge Sort uses <strong>divide and conquer</strong>: divide a range into two halves, solve each smaller problem, then combine their results. Recursion means the sorting function calls itself on those smaller ranges.</p>
        <p>An empty range or a single element is already sorted: this is the base case that stops recursion. The left call finishes before the right call begins. The parent waits for both before merging.</p>
        <p>Compare the first remaining value in each sorted half and copy the smaller one into a temporary buffer. Once a half is exhausted, copy the rest of the other half. Then copy the complete buffer back into the working array, one position at a time.</p>
        <p>On equal values, take the <strong>left value first</strong>. The halves preserve their internal order and the left half came first originally, so equal elements keep their relative order. This makes Merge Sort stable.</p>
      </div>
      <div className="complexity-notes">
        <h3>Complexity</h3>
        <dl>
          <div><dt>Best time</dt><dd>O(n log n)</dd></div>
          <div><dt>Average time</dt><dd>O(n log n)</dd></div>
          <div><dt>Worst time</dt><dd>O(n log n)</dd></div>
          <div><dt>Auxiliary space</dt><dd>O(n)</dd></div>
        </dl>
        <p>Halving gives O(log n) levels, and merging across each level processes O(n) values. This implementation always merges, even for sorted input. It reuses one O(n) buffer plus an O(log n) call stack. AlgoVerse also copies input and stores trace snapshots, which need extra memory.</p>
      </div>
    </section>
  )
}
