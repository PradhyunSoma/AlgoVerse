import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useTracePlayback } from '../../playback/useStepPlayback'
import StepControls from '../../components/StepControls'
import ArrayInput from './ArrayInput'
import { algorithms, type Algorithm } from './sortingCatalog'
import { comparisonPresets, createComparisonRuns } from './comparison'
import ComparisonPanel from './ComparisonPanel'
import ComparisonSummary from './ComparisonSummary'

export default function SortingComparison({ input, onInputChange }: { input: readonly number[]; onInputChange: (values: readonly number[]) => void }) {
  const [selected, setSelected] = useState<readonly Algorithm[]>(['bubble', 'quick'])
  const runs = useMemo(() => createComparisonRuns(selected, input), [selected, input])
  const lengths = useMemo(() => runs.map(run => run.trace.length), [runs])
  const playback = useTracePlayback(lengths)
  function choose(slot: number, algorithm: Algorithm) {
    if (!(algorithm in algorithms) || selected.includes(algorithm)) return
    playback.reset()
    setSelected(current => current.map((value, i) => i === slot ? algorithm : value))
  }
  function resize(count: number) {
    playback.reset()
    setSelected(current => count === 2 ? current.slice(0, 2) : [...current, (Object.keys(algorithms) as Algorithm[]).find(a => !current.includes(a))!])
  }
  function apply(values: readonly number[]) { playback.reset(); onInputChange([...values]) }
  return <div className="sorting-page sorting-comparison">
    <Link className="secondary-link" to="/">← Back to dashboard</Link>
    <header className="sorting-heading"><div><p className="eyebrow">SAME INPUT · DIFFERENT STRATEGIES</p><h1>Compare sorting algorithms</h1><p>Watch the operations. Understand the tradeoffs.</p></div></header>
    <div className="comparison-selectors lesson-panel">
      <label>Number of algorithms<select value={selected.length} onChange={e => resize(Number(e.target.value))}><option value={2}>Two</option><option value={3}>Three</option></select></label>
      {selected.map((algorithm, slot) => <label key={slot}>Algorithm {slot + 1}<select value={algorithm} onChange={e => choose(slot, e.target.value as Algorithm)}>
        {(Object.keys(algorithms) as Algorithm[]).map(id => <option key={id} value={id} disabled={selected.includes(id) && id !== algorithm}>{algorithms[id].title}</option>)}
      </select></label>)}
    </div>
    <ArrayInput initialValues={input} onApply={apply} onPause={playback.pause} presets={comparisonPresets} />
    <section className="lesson-panel comparison-toolbar" aria-label="Shared comparison playback">
      <p>Original input for every algorithm: <code aria-label="Shared original input">[{input.join(', ')}]</code></p>
      <p>Each tick or Next advances every unfinished trace once. Finished traces stay at the end. Previous rewinds each trace once, including finished ones; boundaries clamp at zero. Reset rewinds all traces. Views and selections restart playback safely.</p>
      <p>This is teaching-step synchronization, not equal computational work or a race. The toolbar reports the furthest current trace step; each panel has its own progress.</p>
      <StepControls index={Math.max(...playback.indices)} total={Math.max(...lengths)} {...playback}
        onPrevious={playback.previous} onNext={playback.next} onPlay={playback.play} onPause={playback.pause} onReset={playback.reset} onSpeedChange={playback.setSpeed} />
    </section>
    <section className="lesson-panel metric-conventions" aria-labelledby="metric-conventions-title">
      <h2 id="metric-conventions-title">What we count</h2>
      <p>One key comparison tests two values (or a value and the held key/pivot). Loop bounds, index checks, and teaching events do not count.</p>
      <p>A real swap between distinct positions counts as one swap and two main-array writes, even when the values are equal. Skipped self-swaps count as zero. Insertion shifts count as one write each, never swaps; every key placement also counts as one write, even if its value stays in place.</p>
      <p>Merge buffer value writes count separately from writes back to the main array. Input/result setup copies, buffer allocation and null-clearing, local variables, identity tracking, and snapshots are excluded. A zero means no counted operation of that type, not zero memory use. Counters are cumulative at the displayed step; trace lengths are separate.</p>
    </section>
    <div className="comparison-grid" data-count={selected.length}>{runs.map((run, slot) => <ComparisonPanel key={run.algorithm} run={run} index={playback.indices[slot]} isPlaying={playback.isPlaying} />)}</div>
    {playback.isComplete ? <ComparisonSummary runs={runs} /> : <p className="sorting-roadmap">Finish all selected traces to see the final comparison. Live counters above show only work reached so far.</p>}
  </div>
}
