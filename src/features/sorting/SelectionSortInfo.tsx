import ComplexityPanel from '../../components/ComplexityPanel'
import { sortingComplexity } from './complexity'

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
      <ComplexityPanel profile={sortingComplexity.selection} />
    </section>
  )
}
