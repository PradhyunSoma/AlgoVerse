import ComplexityPanel from '../../components/ComplexityPanel'
import { sortingComplexity } from './complexity'

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
      <ComplexityPanel profile={sortingComplexity.merge} />
    </section>
  )
}
