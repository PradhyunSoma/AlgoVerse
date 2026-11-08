import { createDijkstraTrace } from './dijkstraTrace'
import { dijkstraCode } from './dijkstraCode'
import { reconstructPath } from './shortestPath'
import PriorityQueue from './PriorityQueue'
import DijkstraDistances from './DijkstraDistances'
import RelaxationPanel from './RelaxationPanel'
import ShortestPathPanel from './ShortestPathPanel'
import DijkstraInfo from './DijkstraInfo'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import PseudocodePanel from '../../components/PseudocodePanel'
import StepControls from '../../components/StepControls'
import { useStepPlayback } from '../../playback/useStepPlayback'
import { compareLabels, type VertexId } from './graphModel'
import { parseGraph, sampleGraph } from './graphInput'
import { createBFSTrace } from './bfsTrace'
import { bfsCode } from './bfsCode'
import GraphEditor, { type GraphDraft } from './GraphEditor'
import GraphDiagram from './GraphDiagram'
import BFSQueue from './BFSQueue'
import GraphResults from './GraphResults'
import { createDFSTrace } from './dfsTrace'
import { dfsCode } from './dfsCode'
import { isDijkstraStep, isDFSStep } from './graphStep'
import DFSStack from './DFSStack'
import DFSInfo from './DFSInfo'
import GraphInfo from './GraphInfo'
import '../sorting/sorting.css'
import './graphs.css'

export default function GraphsPage() {
  const [algorithm, setAlgorithm] = useState<'bfs' | 'dfs' | 'dijkstra'>('bfs')
  const [graph, setGraph] = useState(sampleGraph)
  const [start, setStart] = useState<VertexId | null>('v1')
  const [destination, setDestination] = useState<VertexId | null>('v6')
  const [error, setError] = useState('')
  const trace = useMemo(() => algorithm === 'dijkstra' ? createDijkstraTrace(graph, start) : algorithm === 'dfs' ? createDFSTrace(graph, start) : createBFSTrace(graph, start), [graph, start, algorithm])
  const playback = useStepPlayback(trace.length), step = trace[playback.index]
  const weighted = isDijkstraStep(step)
  const path = weighted ? reconstructPath(step, destination) : undefined
  function apply(draft: GraphDraft, resetStart = false) {
    try {
      const next = parseGraph(draft.vertices, draft.edges, draft.directed, graph)
      playback.reset(); setGraph(next)
      setStart(!resetStart && next.vertices.some(v => v.id === start) ? start : [...next.vertices].sort(compareLabels)[0]?.id ?? null)
      setDestination(!resetStart && next.vertices.some(v=>v.id===destination) ? destination : [...next.vertices].sort(compareLabels).at(-1)?.id ?? null)
      setError('')
    } catch (failure) { playback.pause(); setError(failure instanceof Error ? failure.message : 'Check your graph input.') }
  }
  return <div className="sorting-page graph-page">
    <Link className="secondary-link" to="/"><span aria-hidden="true">←</span> Back to dashboard</Link>
    <header className="sorting-heading"><div><p className="eyebrow">GRAPHS · FOLLOW THE CONNECTIONS</p><h1>{algorithm === 'dijkstra' ? "Dijkstra’s Algorithm" : algorithm === 'dfs' ? 'Depth-First Search' : 'Breadth-First Search'}</h1><p>{algorithm === 'dijkstra' ? 'Relax an edge. Update the frontier. Find the cheapest route through a weighted network.' : algorithm === 'dfs' ? 'Follow a branch. Unwind the call stack. Discover how backtracking explores a network.' : 'Discover the frontier. Follow the queue. Watch a network unfold level by level.'}</p></div><span className="lesson-tag">{weighted ? 'Weighted · Binary min-heap' : <>Unweighted · {algorithm === 'dfs' ? 'Recursive call stack' : 'FIFO queue'}</>}</span></header>
    <div className="algorithm-selector"><label htmlFor="graph-algorithm">Algorithm</label><select id="graph-algorithm" value={algorithm} onChange={e => { playback.reset(); setAlgorithm(e.target.value as 'bfs' | 'dfs' | 'dijkstra') }}><option value="bfs">Breadth-First Search (BFS)</option><option value="dfs">Depth-First Search (DFS)</option><option value="dijkstra">Dijkstra’s Algorithm</option></select><p>Switching algorithms keeps the graph and start, pauses playback, and begins a fresh trace.</p></div>
    <GraphEditor weighted={weighted} graph={graph} error={error} onApply={apply} />
    <div className="algorithm-selector"><label htmlFor="bfs-start">Starting vertex</label><select id="bfs-start" value={start ?? ''} disabled={!graph.vertices.length} onChange={e => { playback.reset(); setStart(e.target.value as VertexId); setError('') }}>
      {!graph.vertices.length && <option value="">No vertices</option>}{[...graph.vertices].sort(compareLabels).map(v => <option key={v.id} value={v.id}>{v.label}</option>)}</select><p>Alphabetical neighbors · Reachable vertices only · Changing start pauses and resets playback.</p></div>
    <section className="lesson-panel" aria-labelledby="graph-visual-title"><div className="lesson-panel-heading"><h2 id="graph-visual-title">Inside the graph</h2><span className="lesson-tag">{graph.directed ? 'Directed' : 'Undirected'} · Start {graph.vertices.find(v => v.id === start)?.label ?? 'none'}</span></div>
      <div className="graph-live"><div className="graph-canvas"><GraphDiagram step={step} path={path} />{weighted && <RelaxationPanel step={step} />}</div><div className="graph-frontier">{weighted ? <><PriorityQueue step={step} /><DijkstraDistances step={step} /></> : <>{isDFSStep(step) ? <DFSStack step={step} /> : <BFSQueue step={step} />}<GraphResults step={step} /></>}</div></div>
      <div className="graph-console"><div className="step-explanation" role="status" aria-live={playback.isPlaying ? 'off' : 'polite'} aria-atomic="true"><span className="eyebrow">{step.kind.replaceAll('-', ' ').toUpperCase()}</span><p>{step.explanation}</p></div>
        <StepControls index={playback.index} total={trace.length} canPrevious={playback.canPrevious} canNext={playback.canNext} canPlay={playback.canPlay} isPlaying={playback.isPlaying} isComplete={playback.isComplete} speed={playback.speed} onPrevious={playback.previous} onNext={playback.next} onPlay={playback.play} onPause={playback.pause} onReset={playback.reset} onSpeedChange={playback.setSpeed} /></div>
    </section>
    {weighted && path && <ShortestPathPanel step={step} destination={destination} onDestinationChange={id=>{playback.pause();setDestination(id)}} path={path} />}
    <div className="graph-learning"><PseudocodePanel lines={weighted ? dijkstraCode : algorithm === 'dfs' ? dfsCode : bfsCode} activeLineId={step.lineId} />{weighted ? <DijkstraInfo /> : algorithm === 'dfs' ? <DFSInfo /> : <GraphInfo />}</div>
    <p className="sorting-roadmap">BFS, DFS, and Dijkstra are ready to explore. Comparisons remain planned for Phase 6.</p>
  </div>
}
