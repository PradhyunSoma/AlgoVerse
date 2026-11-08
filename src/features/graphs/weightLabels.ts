import type { EdgeId, Graph, VertexId } from './graphModel'
import { edgeGeometry, type Point } from './graphLayout'
export interface WeightLabel { readonly point: Point; readonly anchor: Point }
/** Fixed-size opaque plaques avoid label-label and label-node collisions. Leaders keep offset labels attached to their edge. */
export function weightLabels(graph: Graph, positions: ReadonlyMap<VertexId,Point>): ReadonlyMap<EdgeId,WeightLabel> {
  const labels = new Map<EdgeId,WeightLabel>()
  const available = (p:Point) => p.x>=25&&p.x<=615&&p.y>=25&&p.y<=(graph.vertices.length>6?595:525)
    && [...positions.values()].every(n=>Math.hypot(n.x-p.x,n.y-p.y)>77)
    && [...labels.values()].every(other=>Math.abs(other.point.x-p.x)>42||Math.abs(other.point.y-p.y)>28)
  for (const edge of [...graph.edges].sort((a,b)=>Number(a.id.slice(1))-Number(b.id.slice(1)))) {
    const source=positions.get(edge.source)!, destination=positions.get(edge.destination)!
    const {start,control,end}=edgeGeometry(source,destination,graph.directed&&graph.edges.some(e=>e.source===edge.destination&&e.destination===edge.source))
    const dx=destination.x-source.x,dy=destination.y-source.y,length=Math.hypot(dx,dy)
    let chosen:WeightLabel|undefined
    for (const t of [.5,.35,.65,.23,.77]) {
      const anchor={x:(1-t)**2*start.x+2*(1-t)*t*control.x+t*t*end.x,y:(1-t)**2*start.y+2*(1-t)*t*control.y+t*t*end.y}
      for (const offset of [0,16,-16,32,-32,48,-48,64,-64]) {
        const point={x:anchor.x-dy/length*offset,y:anchor.y+dx/length*offset}
        if (available(point)) {chosen={point,anchor};break}
      }
      if(chosen)break
    }
    // Bounded canvas fallback: choose the nearest free plaque location, retaining a leader.
    if(!chosen) {
      const anchor={x:(start.x+2*control.x+end.x)/4,y:(start.y+2*control.y+end.y)/4}
      const candidates:Point[]=[]
      for(let x=30;x<=610;x+=44)for(let y=30;y<=520;y+=30)if(available({x,y}))candidates.push({x,y})
      candidates.sort((a,b)=>Math.hypot(a.x-anchor.x,a.y-anchor.y)-Math.hypot(b.x-anchor.x,b.y-anchor.y))
      if(!candidates.length)throw new Error('No readable position for an edge weight.')
      chosen={point:candidates[0],anchor}
    }
    labels.set(edge.id,chosen)
  }
  return labels
}
