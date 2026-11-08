import type { InsertionSortStep } from './insertionSortTrace'

export default function InsertionKey({ step }: { step: InsertionSortStep }) {
  return (
    <div className="insertion-key" role="region" aria-label="Held key">
      <div>
        <span className="eyebrow">HELD KEY</span>
        <strong className="key-value" data-held-value={step.key ?? ''}>
          {step.key ?? '—'}
        </strong>
      </div>
      <p>{step.key !== null
        ? `Key ${step.key} is held outside the array. Vacant slot: index ${step.vacantIndex}.`
        : 'No key is held. All values are in the array.'}</p>
    </div>
  )
}
