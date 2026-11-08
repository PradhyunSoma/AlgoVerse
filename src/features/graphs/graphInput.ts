import { parseWeight } from './graphWeights'
import { edgeKey, immutableGraph, MAX_EDGES, MAX_VERTICES, SAMPLE_EDGES, SAMPLE_VERTICES, validateGraph, type Edge, type Graph, type Vertex } from './graphModel'

/** Comma-separated labels; one source-destination pair per nonempty line. Edits preserve retained identities. */
export function parseGraph(verticesText: string, edgesText: string, directed: boolean, previous?: Graph): Graph {
  if (previous) validateGraph(previous)
  const labels = verticesText.trim() ? verticesText.split(',').map(label => label.trim().toUpperCase()) : []
  if (labels.length > MAX_VERTICES) throw new Error(`Use at most ${MAX_VERTICES} vertices.`)
  if (labels.some(label => !/^[A-Z][A-Z0-9]{0,3}$/.test(label))) throw new Error('Use comma-separated labels of 1–4 letters/digits, beginning with a letter. Empty labels are not allowed.')
  if (new Set(labels).size !== labels.length) throw new Error('Vertex labels must be unique (case-insensitive).')
  let nextVertexId = previous?.nextVertexId ?? 1, nextEdgeId = previous?.nextEdgeId ?? 1
  const vertices: Vertex[] = labels.map(label => previous?.vertices.find(v => v.label === label) ?? { id: `v${nextVertexId++}`, label })
  const lines = edgesText.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
  if (lines.length > MAX_EDGES) throw new Error(`Use at most ${MAX_EDGES} edges.`)
  const connections = new Set<string>()
  const edges: Edge[] = lines.map(line => {
    const match = /^([A-Z][A-Z0-9]{0,3})\s*-\s*([A-Z][A-Z0-9]{0,3})(?:\s*:\s*(.*))?$/i.exec(line)
    if (!match) throw new Error(`Invalid edge “${line}”. Use one pair per line, such as A-B or A-B: 4.`)
    const source = vertices.find(v => v.label === match[1].toUpperCase()), destination = vertices.find(v => v.label === match[2].toUpperCase())
    if (!source || !destination) throw new Error(`Unknown vertex in “${line}”. Define both labels first; remove incident edges when removing a vertex.`)
    const key = edgeKey(source.id, destination.id, directed)
    if (connections.has(key)) throw new Error('Duplicate edges are not allowed (reversed pairs also count in undirected mode).')
    connections.add(key)
    const retained = previous?.edges.find(e => edgeKey(e.source, e.destination, directed) === edgeKey(source.id, destination.id, directed))
    return { id: retained?.id ?? `e${nextEdgeId++}`, source: source.id, destination: destination.id, weight: match[3] === undefined ? 1 : parseWeight(match[3]) }
  })
  return immutableGraph({ vertices, edges, directed, nextVertexId, nextEdgeId })
}
export const sampleGraph = () => parseGraph(SAMPLE_VERTICES, SAMPLE_EDGES, false)
