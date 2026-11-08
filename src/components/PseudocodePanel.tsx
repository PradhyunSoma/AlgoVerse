export interface PseudocodeLine<LineId extends string = string> {
  readonly id: LineId
  readonly text: string
  readonly indent: number
}

interface PseudocodePanelProps {
  lines: readonly PseudocodeLine[]
  activeLineId: string
}

export default function PseudocodePanel({ lines, activeLineId }: PseudocodePanelProps) {
  return (
    <section className="code-panel lesson-panel" aria-labelledby="pseudocode-title">
      <div className="lesson-panel-heading">
        <h2 id="pseudocode-title">Follow the logic</h2>
        <span className="lesson-tag">Pseudocode</span>
      </div>
      <p className="code-caption">The highlighted line matches the current step.</p>
      <ol className="pseudocode-lines" aria-label="Pseudocode instructions">
        {lines.map((line, index) => (
          <li key={line.id} data-line-id={line.id} aria-current={line.id === activeLineId ? 'step' : undefined}>
            <span className="code-line-number" aria-hidden="true">{index + 1}</span>
            <code style={{ paddingInlineStart: `${line.indent * 12}px` }}>{line.text}</code>
            {line.id === activeLineId && <span className="sr-only">Current instruction</span>}
          </li>
        ))}
      </ol>
    </section>
  )
}
