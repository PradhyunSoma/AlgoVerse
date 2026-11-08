import ComplexityPanel from '../../components/ComplexityPanel'
import { sortingComplexity } from './complexity'

export default function BubbleSortInfo() {
  return (
    <section className="bubble-info lesson-panel" aria-labelledby="bubble-info-title">
      <div>
        <p className="eyebrow">UNDERSTAND THE ALGORITHM</p>
        <h2 id="bubble-info-title">Why does it work?</h2>
        <p>Bubble Sort orders an array from smallest to largest by comparing neighbors. If the left value is larger, the pair swaps places. Equal values stay in place.</p>
        <p>Each comparison carries the larger value to the right. By the end of a pass, the largest remaining value has reached its final position. The next pass scans a shorter range.</p>
        <p>We use <strong>early exit</strong>. If a complete pass makes no swaps, every neighboring pair is already in order and the algorithm stops.</p>
      </div>
      <ComplexityPanel profile={sortingComplexity.bubble} />
    </section>
  )
}
