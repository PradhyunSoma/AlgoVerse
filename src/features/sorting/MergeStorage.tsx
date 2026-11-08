import type { MergeSortStep } from './mergeSortTrace'

export default function MergeStorage({ step }: { step: MergeSortStep }) {
  if (step.sourceValues === null || step.mid === null) return null
  const leftLength = step.mid - step.lo
  function sourceRow(side: 'Left' | 'Right', values: readonly number[], offset: number) {
    return <div className={`merge-source merge-source-${side.toLowerCase()}`}>
      <h3>{side} source · [{offset}, {offset + values.length})</h3>
      <ol className="merge-cells" aria-label={`${side} merge source`}>
        {values.map((value, local) => {
          const index = offset + local
          const state = step.sourceIndex === index ? 'Selected'
            : step.kind === 'compare' && (step.leftIndex === index || step.rightIndex === index) ? 'Compare' : side
          return <li key={index} data-state={state} className={`merge-cell bar-${state.toLowerCase()}`}
            aria-label={`Index ${index}, value ${value}, ${state}`}>
            <strong>{value}</strong><span>[{index}]</span><span>{state}</span>
          </li>
        })}
      </ol>
    </div>
  }
  const target = step.destinationIndex ?? step.outputIndex
  return (
    <section className="merge-storage" aria-label="Merge storage">
      <p className="merge-storage-note">Source snapshots stay fixed during this merge. Buffer values are temporary copies, not additional input elements.</p>
      <div className="merge-sources">
        {sourceRow('Left', step.sourceValues.slice(0, leftLength), step.lo)}
        {sourceRow('Right', step.sourceValues.slice(leftLength), step.mid)}
      </div>
      <h3>Temporary merge buffer · [{step.lo}, {step.hi})</h3>
      <ol className="merge-cells" aria-label="Temporary merge buffer">
        {step.buffer.map((value, local) => {
          const index = step.lo + local
          const state = index === target && step.kind !== 'merge-end' ? 'Destination' : value === null ? 'Empty' : 'Written'
          return <li key={index} className={`merge-cell ${state === 'Destination' ? 'bar-destination' : 'bar-ready'}`}
            data-value={value ?? ''} data-state={state} aria-label={`Buffer index ${index}, ${value === null ? 'empty' : `value ${value}`}, ${state}`}>
            <strong>{value ?? '—'}</strong><span>[{index}]</span><span>{state}</span>
          </li>
        })}
      </ol>
      <p className="merge-storage-note">{step.kind === 'copy'
        ? 'Copy-back in progress. The working array can temporarily contain repeated values as old entries are overwritten; the full sorted result is preserved in this buffer.'
        : step.kind === 'merge-end' ? 'Copy-back is complete. This range is now merged in the working array.'
          : 'The working array stays unchanged while this buffer fills. Empty slots have not been written yet.'}</p>
    </section>
  )
}
