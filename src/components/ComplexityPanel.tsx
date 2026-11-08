import type { ComplexityProfile } from './complexity'
import './complexity.css'

/** A shared reading pattern; each feature owns its implementation-specific facts. */
export default function ComplexityPanel({ profile }: { profile: ComplexityProfile }) {
  return <section className="complexity-notes complexity-panel" aria-label={`${profile.name} complexity`}>
    <h3>Time and space complexity</h3>
    <p>{profile.variables}</p>
    <p>Core algorithm bounds, excluding the visualizer overhead described below.</p>
    <dl>{profile.rows.map(({ label, bound }) => <div key={label}><dt>{label}</dt><dd>{bound}</dd></div>)}</dl>
    <p><strong>Why?</strong> {profile.why}</p>
    <details>
      <summary>Implementation assumptions and storage</summary>
      {profile.assumptions.map(text => <p key={text}>{text}</p>)}
      {profile.storage.map(text => <p key={text}>{text}</p>)}
    </details>
    <p className="complexity-measurement"><strong>Growth rates, not measurements.</strong> Big-O describes how work or memory scales as input grows. O(n²) does not mean exactly n² comparisons; O(log n) does not mean exactly log₂(n) steps. Playback steps include explanations and pointer updates, so they are not operation counts or runtime benchmarks.</p>
  </section>
}
