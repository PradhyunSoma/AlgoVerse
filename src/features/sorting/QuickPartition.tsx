import type { QuickSortStep } from './quickSortTrace'

export default function QuickPartition({ step }: { step: QuickSortStep }) {
  const fixed = step.pivotIndex !== null && step.finalIndices.includes(step.pivotIndex)
  return (
    <section className="quick-partition" aria-label="Pivot and partition">
      <div className="quick-pivot-summary">
        <div><span className="eyebrow">PIVOT</span><strong data-pivot-value={step.pivotValue ?? ''}>{step.pivotValue ?? '—'}</strong></div>
        <p>{step.pivotIndex === null ? 'No pivot selected for this call.'
          : `Value ${step.pivotValue} at index ${step.pivotIndex} · ${fixed ? 'Final position' : 'Current pivot'}`}</p>
      </div>
      <p><strong>Boundary i</strong> marks the end of the processed ≤ pivot region. It begins at low − 1, before the range, when that region is empty. j scans the next value.</p>
      {step.kind === 'boundary' ? <p className="quick-boundary-pending">i just moved to reserve index {step.i}. {step.i === step.j ? 'The scanned value is already there; the next step skips a self-swap.' : 'Swap pending: this slot is not classified as ≤ pivot until the swap finishes.'}</p>
        : step.i !== null && !fixed && <p>The completed ≤ pivot region is {step.i < step.low ? 'empty' : `[${step.low}, ${step.i}]`}. Processed larger values stay to its right; unscanned values are labeled Unseen.</p>}
      <p className="quick-final-note">Only placed pivots and single-element base cases become final. The two sides of a newly placed pivot still need recursive sorting.</p>
    </section>
  )
}
