import { circularWalk, copyCircularList, type CircularState } from './circularListModel'
import { runCircularOperation, type CircularEvent } from './circularListOperations'
import type { ListOperation } from './listOperations'

export interface CircularStep extends CircularEvent {
  readonly type: 'circular'
  readonly state: CircularState
  readonly lineId: CircularEvent['kind']
}
export function readyCircularTrace(state: CircularState): readonly CircularStep[] {
  return [{ type: 'circular', state: copyCircularList(state), kind: 'ready', lineId: 'ready', current: null, previous: null,
    successor: null, held: null, newId: null, dataAssigned: true, removed: null, pointer: null, followed: null,
    visited: [], layout: circularWalk(state).nodes.map((node) => node.id), explanation: 'Choose an operation. The last node points back to HEAD; traversal stops after one lap.' }]
}
export function createCircularTrace(state: CircularState, operation: ListOperation): readonly CircularStep[] {
  const steps: CircularStep[] = []
  runCircularOperation(state, operation, (event, snapshot) => {
    steps.push({ ...event, type: 'circular', state: copyCircularList(snapshot), lineId: event.kind,
      layout: [...event.layout], visited: [...event.visited], pointer: event.pointer ? { ...event.pointer } : null,
      removed: event.removed ? { ...event.removed } : null })
  })
  return steps
}
