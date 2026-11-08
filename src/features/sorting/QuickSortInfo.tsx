export default function QuickSortInfo() {
  return (
    <section className="bubble-info lesson-panel" aria-labelledby="quick-info-title">
      <div>
        <p className="eyebrow">UNDERSTAND THE ALGORITHM</p>
        <h2 id="quick-info-title">Why does it work?</h2>
        <p>Quick Sort uses <strong>divide and conquer</strong>. It chooses a pivot, partitions the current range around it, then recursively sorts the smaller ranges on either side.</p>
        <p>We use <strong>Lomuto partitioning with the last element as pivot</strong>. i starts just before low. As j scans, every value ≤ pivot moves into the next position of the left region. Values &gt; pivot stay in the processed region on its right. Moving i reserves a slot; a swap fills it when needed.</p>
        <p>After scanning, place the pivot at i + 1. All values to its left are ≤ pivot and all to its right are greater, so this pivot is final. Those sides are not necessarily ordered: recursive calls sort the left side first, then the right. Empty and single-element ranges end recursion.</p>
        <p>Merge Sort divides first and combines sorted halves using a buffer. Quick Sort partitions before recursing and swaps within the working array. These distant swaps can reverse equal-valued elements, so standard Quick Sort is <strong>not stable</strong>.</p>
      </div>
      <div className="complexity-notes">
        <h3>Complexity</h3>
        <dl>
          <div><dt>Best time · balanced partitions</dt><dd>O(n log n)</dd></div>
          <div><dt>Average time</dt><dd>O(n log n)</dd></div>
          <div><dt>Worst time</dt><dd>O(n²)</dd></div>
          <div><dt>Average auxiliary stack space</dt><dd>O(log n)</dd></div>
          <div><dt>Worst auxiliary stack space</dt><dd>O(n)</dd></div>
        </dl>
        <p>Balanced partitions give logarithmic depth. With the last element as pivot, sorted, reverse-sorted, or all-equal input can repeatedly produce a side of length n − 1, causing quadratic time and linear stack depth. Average bounds assume suitably mixed input. AlgoVerse also copies input and saves trace snapshots, using extra memory.</p>
      </div>
    </section>
  )
}
