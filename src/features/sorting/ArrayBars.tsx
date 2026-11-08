import { barClass, type BarState } from './sortingPresentation'

interface ArrayBarsProps {
  values: readonly (number | null)[]
  states: readonly BarState[]
  heldValue?: number | null
  markers?: readonly string[]
}

export default function ArrayBars({ values, states, heldValue = null, markers }: ArrayBarsProps) {
  // Include the held key in the scale so lifting it does not resize other bars.
  const presentValues = [...values, heldValue].filter((value): value is number => value !== null)
  const maximum = Math.max(0, ...presentValues)
  const minimum = Math.min(0, ...presentValues)
  const range = maximum - minimum || 1
  const zeroPosition = maximum / range * 100

  return (
    <figure className="array-figure" aria-label="Current array visualization">
      <div className="array-scroll" role="region" aria-label="Array bars, scroll horizontally for larger arrays" tabIndex={0}>
        <ol className="array-bars" aria-label="Current array" style={{ minWidth: `${Math.max(0, values.length * 48 - 8)}px` }}>
          {values.map((value, index) => {
            const state = states[index]
            const height = Math.abs(value ?? 0) / range * 100
            const top = (maximum - Math.max(0, value ?? 0)) / range * 100
            return (
              <li key={index} className={`array-column ${barClass(state)}`}
                aria-label={value === null ? `Index ${index}, vacant insertion position` : `Index ${index}, value ${value}, ${state}${markers?.[index] ? `, ${markers[index]}` : ''}`}
                data-value={value ?? ''} data-state={state}>
                <div className="bar-track" aria-hidden="true">
                  <span className="bar-zero" style={{ top: `${zeroPosition}%` }} />
                  {value === null ? <span className="vacant-slot" />
                    : <span className="array-bar" style={{ top: `${top}%`, height: value === 0 ? '2px' : `${height}%` }} />}
                </div>
                <span className="bar-value" aria-hidden="true">{value ?? '—'}</span>
                <span className="bar-index" aria-hidden="true">[{index}]</span>
                {markers && <span className="bar-markers" aria-hidden="true">{markers[index] || '·'}</span>}
                <span className="bar-state" aria-hidden="true">{state}</span>
              </li>
            )
          })}
        </ol>
      </div>
      {values.length === 0 && <p className="empty-array">The array is empty.</p>}
      <figcaption>Indices start at 0. Bars extend from the zero line, with negative values pointing down. Scroll horizontally to inspect larger arrays.</figcaption>
    </figure>
  )
}
