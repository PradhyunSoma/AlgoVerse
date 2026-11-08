import { copyList, listNodes, type ListState } from './listModel'
import { runListOperation, type ListEvent, type ListOperation } from './listOperations'

export interface ListStep extends ListEvent {
  readonly state: ListState
  readonly lineId: ListEvent['kind']
}

export function readyListTrace(state: ListState): readonly ListStep[] {
  return [{ state: copyList(state), kind: 'ready', lineId: 'ready', current: null, previous: null,
    held: null, newId: null, dataAssigned: true, removed: null, pointer: null, followed: null,
    visited: [], layout: listNodes(state).map((node) => node.id),
    explanation: 'Choose an operation and apply it to create a step-by-step trace.' }]
}

export function createListTrace(state: ListState, operation: ListOperation): readonly ListStep[] {
  const steps: ListStep[] = []
  runListOperation(state, operation, (event, snapshot) => {
    steps.push({ ...event, state: copyList(snapshot), lineId: event.kind,
      visited: [...event.visited], layout: [...event.layout],
      pointer: event.pointer ? { ...event.pointer } : null,
      removed: event.removed ? { ...event.removed } : null })
  })
  return steps
}
