import type { OperationMetrics } from './operationMetrics'
export default function ComparisonMetrics({ metrics }: { metrics: OperationMetrics }) {
  return <dl className="comparison-metrics" aria-label="Operation counts">
    {([
      ['comparisons', 'Key comparisons'], ['swaps', 'Swaps'], ['arrayWrites', 'Main-array writes'],
      ['bufferWrites', 'Buffer value writes'], ['shifts', 'Shifts'],
    ] as const).map(([key, label]) => <div key={key}><dt>{label}</dt><dd data-metric={key}>{metrics[key]}</dd></div>)}
  </dl>
}
