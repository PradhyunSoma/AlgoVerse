import type { ComparisonRun } from './comparison'
import { comparisonInsight } from './comparison'
import { algorithms } from './sortingCatalog'
import { sortingComplexity } from './complexity'

export default function ComparisonSummary({ runs }: { runs: readonly ComparisonRun[] }) {
  return <section className="lesson-panel comparison-summary" aria-labelledby="comparison-summary-title">
    <h2 id="comparison-summary-title">Completed comparison</h2>
    <p>Same input · {runs[0].original.length} values · [{runs[0].original.join(', ')}]. Counts are for this execution, not a speed ranking.</p>
    <div className="comparison-table-scroll" role="region" aria-label="Final comparison table, scroll horizontally" tabIndex={0}>
      <table><caption>Observed operations and theoretical core bounds</caption><thead><tr>
        {['Algorithm', 'Input size', 'Key comparisons', 'Swaps', 'Main-array writes', 'Buffer value writes', 'Trace steps', 'Best time', 'Average time', 'Worst time', 'Core auxiliary space'].map(label => <th key={label} scope="col">{label}</th>)}
      </tr></thead><tbody>{runs.map(run => {
        const m = run.trace.at(-1)!.metrics, profile = sortingComplexity[run.algorithm]
        return <tr key={run.algorithm}><th scope="row">{algorithms[run.algorithm].title}</th>
          <td>{run.original.length}</td><td>{m.comparisons}</td><td>{m.swaps}</td><td>{m.arrayWrites}</td><td>{m.bufferWrites}</td><td>{run.trace.length}</td>
          {profile.rows.slice(0, 3).map(row => <td key={row.label}>{row.bound}</td>)}
          <td>{profile.rows.slice(3).map(row => `${row.label}: ${row.bound}`).join('; ')}</td>
        </tr>
      })}</tbody></table>
    </div>
    <p>Trace steps include teaching events, not equal work units or elapsed time. Comparisons, swaps, and writes have different costs; no single counter establishes which algorithm is fastest. Average sorting bounds assume random permutations of distinct values. Private input copies and saved traces are additional to core auxiliary space.</p>
    <ul>{runs.map(run => <li key={run.algorithm}><strong>{algorithms[run.algorithm].title}:</strong> {comparisonInsight(run)}</li>)}</ul>
  </section>
}
