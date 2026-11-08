import { Link } from 'react-router'
import Icon from '../components/Icon'
import './codeVisualizer.css'

const plannedFeatures = [
  'Line-by-line execution highlighting',
  'Variable values and state changes',
  'Loops and conditional execution',
  'Function calls and recursion',
  'Call stack visualization',
  'Supported data structure visualizations',
  'Interactive playback controls',
]

export default function CodeVisualizerPage() {
  return <div className="code-coming-page">
    <Link className="secondary-link" to="/"><span aria-hidden="true">←</span> Back to Dashboard</Link>
    <header className="code-coming-heading">
      <span className="code-coming-symbol"><Icon name="code" /></span>
      <span className="code-coming-badge">Coming Soon</span>
      <h1>Custom Code Visualizer</h1>
      <p>Visualize how your own code executes, step by step.</p>
    </header>
    <div className="code-coming-layout">
      <section aria-labelledby="code-future-title" className="code-coming-copy">
        <h2 id="code-future-title">We're building a new way to understand code.</h2>
        <p>Soon, you'll be able to write or paste your own programs and explore how they execute internally, including:</p>
        <ul>{plannedFeatures.map(feature => <li key={feature}>{feature}</li>)}</ul>
        <p className="code-coming-note">The programming language and execution experience are still being planned.</p>
      </section>
      <figure className="code-preview" aria-labelledby="code-preview-caption">
        <figcaption id="code-preview-caption"><Icon name="eye" /><span>Illustrative preview · Not interactive</span></figcaption>
        <div className="code-preview-editor">
          <h2>Future editor</h2>
          <p className="code-preview-note">Plain-language example, not executable code</p>
          <ol>
            <li>Read an initial value</li>
            <li>Repeat the next operation</li>
            <li className="code-preview-line">Update the current result <span>← execution line</span></li>
            <li>Return the result</li>
          </ol>
        </div>
        <div className="code-preview-state">
          <section aria-labelledby="preview-variables"><h2 id="preview-variables">Variables</h2><dl><div><dt>current value</dt><dd>3</dd></div><div><dt>result</dt><dd>6</dd></div></dl></section>
          <section aria-labelledby="preview-stack"><h2 id="preview-stack">Call stack</h2><ol><li>Current call <span>← active</span></li><li>Caller</li><li>Entry</li></ol></section>
        </div>
        <p className="code-preview-note">A static sketch of a future learning experience. No code is running.</p>
      </figure>
    </div>
  </div>
}
