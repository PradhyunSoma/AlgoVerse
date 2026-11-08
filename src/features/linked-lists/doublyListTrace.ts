import { copyDoublyList, doublyNodes, type DoublyState } from './doublyListModel'
import { runDoublyOperation, type DoublyEvent, type DoublyOperation } from './doublyListOperations'

export interface DoublyStep extends DoublyEvent {
  readonly type: 'doubly'
  readonly state: DoublyState
  readonly lineId: DoublyEvent['kind']
}

export function readyDoublyTrace(state: DoublyState): readonly DoublyStep[] {
  return [{ type: 'doubly', state: copyDoublyList(state), kind: 'ready', lineId: 'ready', current: null,
    left: null, right: null, held: null, newId: null, dataAssigned: true, removed: null, pointer: null, followed: null,
    visited: [], layout: doublyNodes(state).map((node) => node.id), explanation: 'Choose an operation and apply it to inspect both pointer directions.' }]
}

export function createDoublyTrace(state: DoublyState, operation: DoublyOperation): readonly DoublyStep[] {
  const steps: DoublyStep[] = []
  runDoublyOperation(state, operation, (event, snapshot) => {
    steps.push({ ...event, type: 'doubly', state: copyDoublyList(snapshot), lineId: event.kind,
      visited: [...event.visited], layout: [...event.layout], pointer: event.pointer ? { ...event.pointer } : null,
      followed: event.followed ? { ...event.followed } : null, removed: event.removed ? { ...event.removed } : null })
  })
  return steps
}
