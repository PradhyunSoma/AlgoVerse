export default function InsertionSortInfo() {
  return (
    <section className="bubble-info lesson-panel" aria-labelledby="insertion-info-title">
      <div>
        <p className="eyebrow">UNDERSTAND THE ALGORITHM</p>
        <h2 id="insertion-info-title">Why does it work?</h2>
        <p>Insertion Sort builds an ordered portion from left to right. One element is already ordered by itself, so the first element is our starting portion.</p>
        <p>The next element becomes the <strong>key</strong>, held outside the array. Larger elements shift one position right, moving the vacant slot left. When the key meets a smaller or equal value, or reaches the left edge, it fills that slot.</p>
        <p>The sorted portion is ordered, but its values are not necessarily in their final positions yet. Later keys may shift them again. Equal values never shift past the key, so their original relative order is preserved: this is <strong>stability</strong>.</p>
        <p>Bubble Sort repeatedly swaps neighbors. Selection Sort finds a minimum across the remaining range. Insertion Sort instead places one key into the ordered portion. Nearly sorted arrays need few shifts, making Insertion Sort especially effective for them.</p>
      </div>
      <div className="complexity-notes">
        <h3>Complexity</h3>
        <dl>
          <div><dt>Best time · already sorted</dt><dd>O(n)</dd></div>
          <div><dt>Average time</dt><dd>O(n²)</dd></div>
          <div><dt>Worst time · reverse sorted</dt><dd>O(n²)</dd></div>
          <div><dt>Auxiliary working space</dt><dd>O(1)</dd></div>
        </dl>
        <p>Already sorted input needs one value comparison per key and no shifts. Reverse order can shift every earlier value for each key. The core sort holds one key and a few indices. AlgoVerse also copies input and records snapshots and identities, using extra memory.</p>
      </div>
    </section>
  )
}
