export const MAX_EDGE_WEIGHT = 99
export function validateWeight(weight: number): void {
  if (!Number.isFinite(weight) || !Number.isInteger(weight) || weight < 0 || weight > MAX_EDGE_WEIGHT) {
    throw new Error(`Edge weights must be finite, nonnegative integers from 0 to ${MAX_EDGE_WEIGHT}. Dijkstra cannot use negative weights.`)
  }
}
export function parseWeight(text: string): number {
  if (!/^\d+$/.test(text.trim())) throw new Error(`Invalid weight “${text}”. Use a nonnegative whole number from 0 to ${MAX_EDGE_WEIGHT}; negative, fractional, or missing weights after a colon are not allowed.`)
  const value = Number(text.trim()); validateWeight(value); return value
}
export const DIJKSTRA_VERTICES = 'A, B, C, D, E'
export const DIJKSTRA_EDGES = 'A-B: 4\nA-C: 1\nC-B: 2\nB-D: 1\nC-D: 5\nD-E: 3\nB-E: 7'
export const distanceText = (distance: number) => distance === Infinity ? '∞' : String(distance)
