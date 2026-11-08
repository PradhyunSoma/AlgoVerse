/** Educational metadata only: algorithm modules must not depend on presentation. */
export interface ComplexityEntry {
  readonly label: string
  readonly bound: string
}
export interface ComplexityProfile {
  readonly name: string
  readonly variables: string
  readonly rows: readonly ComplexityEntry[]
  readonly why: string
  readonly assumptions: readonly string[]
  readonly storage: readonly string[]
}
