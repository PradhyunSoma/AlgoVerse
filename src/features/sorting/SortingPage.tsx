import { useRef, useState, type KeyboardEvent } from 'react'
import SortingVisualizer from './SortingVisualizer'
import SortingComparison from './SortingComparison'
import { sample } from './sortingCatalog'
import './comparison.css'

export default function SortingPage() {
  const [view, setView] = useState<'visualize' | 'compare'>('visualize')
  const [input, setInput] = useState<readonly number[]>(sample)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  function keyboard(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : ['ArrowLeft', 'ArrowRight'].includes(event.key) ? 1 - index : null
    if (next === null) return
    event.preventDefault(); setView(next === 0 ? 'visualize' : 'compare'); tabs.current[next]?.focus()
  }
  return <>
    <div className="sorting-view-tabs" role="tablist" aria-label="Sorting view">
      {(['visualize', 'compare'] as const).map((value, index) => <button key={value} ref={node => { tabs.current[index] = node }}
        type="button" role="tab" id={`sorting-${value}-tab`} aria-controls={`sorting-${value}-panel`} aria-selected={view === value}
        tabIndex={view === value ? 0 : -1} onClick={() => setView(value)} onKeyDown={e => keyboard(e, index)}>{value === 'visualize' ? 'Visualize' : 'Compare'}</button>)}
    </div>
    <div role="tabpanel" id="sorting-visualize-panel" aria-labelledby="sorting-visualize-tab" hidden={view !== 'visualize'}>
      {view === 'visualize' && <SortingVisualizer input={input} onInputChange={setInput} />}
    </div>
    <div role="tabpanel" id="sorting-compare-panel" aria-labelledby="sorting-compare-tab" hidden={view !== 'compare'}>
      {view === 'compare' && <SortingComparison input={input} onInputChange={setInput} />}
    </div>
  </>
}
