export default function SelectionSortInfo() {
  return (
    <section className="bubble-info lesson-panel" aria-labelledby="selection-info-title">
      <div>
        <p className="eyebrow">UNDERSTAND THE ALGORITHM</p>
        <h2 id="selection-info-title">Why does it work?</h2>
        <p>Selection Sort scans the unsorted portion to find its smallest value. Remembering the minimum index lets us compare every candidate before moving any values.</p>
        <p>At the end of each pass, swap that minimum into the first unsorted position. Nothing remaining can be smaller, so this position is final. The sorted portion grows from left to right. If the minimum is already in place, skip the swap.</p>
        <p>Bubble Sort swaps neighboring values as it scans and can stop early. Selection Sort scans the entire remaining portion, then makes at most one swap per pass. Even an already sorted array needs all the comparisons. Equal candidates keep the current minimum, but distant swaps mean standard Selection Sort is not stable.</p>
      </div>
      <div className="complexity-notes">
        <h3>Complexity</h3>
        <dl>
          <div><dt>Best time · already sorted</dt><dd>O(n²)</dd></div>
          <div><dt>Average time</dt><dd>O(n²)</dd></div>
          <div><dt>Worst time · reverse sorted</dt><dd>O(n²)</dd></div>
          <div><dt>Auxiliary working space</dt><dd>O(1)</dd></div>
        </dl>
        <p>For n values, standard Selection Sort makes n(n − 1)/2 comparisons. The core sort needs O(1) working space. AlgoVerse copies your input and saves snapshots for Previous Step, using extra memory.</p>
      </div>
    </section>
  )
}
