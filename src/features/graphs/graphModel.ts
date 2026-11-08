import { validateWeight } from './graphWeights'

export type VertexId = `v${number}`
export type EdgeId = `e${number}`
export interface Vertex { readonly id: VertexId; readonly label: string }
// Edge identity is independent of its editable weight.
export interface Edge { readonly id: EdgeId; readonly source: VertexId; readonly destination: VertexId; readonly weight: number }
export interface Graph {
  readonly directed: boolean
  readonly vertices: readonly Vertex[]
  readonly edges: readonly Edge[]
  readonly nextVertexId: number
  readonly nextEdgeId: number
}
export const MAX_VERTICES = 10
export const MAX_EDGES = 20
export const SAMPLE_VERTICES = 'A, B, C, D, E, F'
export const SAMPLE_EDGES = 'A-B\nA-C\nB-D\nB-E\nC-F\nE-F'
export const compareLabels = (a: Vertex, b: Vertex) => a.label < b.label ? -1 : a.label > b.label ? 1 : 0
export function edgeKey(source: string, destination: string, directed: boolean) {
  return (directed ? [source, destination] : [source, destination].sort()).join(':')
}
export function validateGraph(graph: Graph): void {
  if (typeof graph.directed !== 'boolean') throw new Error('Choose directed or undirected mode.')
  if (graph.vertices.length > MAX_VERTICES || graph.edges.length > MAX_EDGES) throw new Error(`Use at most ${MAX_VERTICES} vertices and ${MAX_EDGES} edges.`)
  const ids = new Set<VertexId>(), labels = new Set<string>(), edges = new Set<string>(), edgeIds = new Set<EdgeId>()
  for (const vertex of graph.vertices) {
    if (!/^v[1-9]\d*$/.test(vertex.id) || ids.has(vertex.id)) throw new Error('Vertex IDs must be unique and valid.')
    if (!/^[A-Z][A-Z0-9]{0,3}$/.test(vertex.label) || labels.has(vertex.label)) throw new Error('Labels must be unique: 1–4 uppercase letters/digits, beginning with a letter.')
    ids.add(vertex.id); labels.add(vertex.label)
  }
  for (const edge of graph.edges) {
    validateWeight(edge.weight)
    if (!/^e[1-9]\d*$/.test(edge.id) || edgeIds.has(edge.id)) throw new Error('Edge IDs must be unique and valid.')
    if (!ids.has(edge.source) || !ids.has(edge.destination)) throw new Error('Every edge must connect existing vertices.')
    if (edge.source === edge.destination) throw new Error('Self-loops are not supported. Connect two different vertices.')
    const key = edgeKey(edge.source, edge.destination, graph.directed)
    if (edges.has(key)) throw new Error('Duplicate edges are not allowed (reversed pairs also count in undirected mode).')
    edges.add(key); edgeIds.add(edge.id)
  }
  if (!Number.isSafeInteger(graph.nextVertexId) || graph.nextVertexId <= Math.max(0, ...graph.vertices.map(v => Number(v.id.slice(1)))) ||
      !Number.isSafeInteger(graph.nextEdgeId) || graph.nextEdgeId <= Math.max(0, ...graph.edges.map(e => Number(e.id.slice(1))))) throw new Error('ID counters must exceed all existing IDs.')
}
export function immutableGraph(graph: Graph): Graph {
  validateGraph(graph)
  return Object.freeze({ ...graph, vertices: Object.freeze(graph.vertices.map(v => Object.freeze({ ...v }))), edges: Object.freeze(graph.edges.map(e => Object.freeze({ ...e }))) })
}
