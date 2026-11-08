import ComplexityPanel from '../../components/ComplexityPanel'
import { sortingComplexity } from './complexity'

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
      <ComplexityPanel profile={sortingComplexity.quick} />
    </section>
  )
}
