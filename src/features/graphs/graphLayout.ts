import { compareLabels, type Graph, type VertexId } from './graphModel'
export interface Point { readonly x: number; readonly y: number }
/** Layout depends only on graph labels, never traversal state or source. Convex placement avoids edges passing through vertices. */
export function layoutGraph(graph: Graph): ReadonlyMap<VertexId, Point> {
  const vertices = [...graph.vertices].sort(compareLabels)
  // A fixed six-slot arrangement also keeps the sample's edges from crossing.
  const slots = vertices.length === 6 ? [0, 1, 5, 2, 3, 4] : vertices.map((_, i) => i)
  const radius = vertices.length > 6 ? 245 : 180
  return new Map(vertices.map((v, i) => {
    const angle = 2 * Math.PI * slots[i] / vertices.length - Math.PI / 2
    return [v.id, { x: 320 + (vertices.length === 1 ? 0 : radius * Math.cos(angle)), y: 310 + (vertices.length === 1 ? 0 : radius * Math.sin(angle)) }]
  }))
}
export function edgeGeometry(source: Point, destination: Point, reciprocal: boolean) {
  const dx = destination.x - source.x, dy = destination.y - source.y, length = Math.hypot(dx, dy)
  const bend = reciprocal ? 32 : 0
  const control = { x: (source.x + destination.x) / 2 - dy / length * bend, y: (source.y + destination.y) / 2 + dx / length * bend }
  const trim = (from: Point, toward: Point) => {
    const distance = Math.hypot(toward.x - from.x, toward.y - from.y)
    return { x: from.x + (toward.x - from.x) / distance * 34, y: from.y + (toward.y - from.y) / distance * 34 }
  }
  const a = trim(source, control), b = trim(destination, control)
  return { start: a, control, end: b }
}

export function edgePath(source: Point, destination: Point, reciprocal: boolean): string {
  const {start,control,end}=edgeGeometry(source,destination,reciprocal)
  return `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`
}
