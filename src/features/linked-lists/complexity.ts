import type { ComplexityProfile } from '../../components/complexity'

const variables = 'n = number of list nodes. Time entries are worst-case bounds for the core pointer walk and updates; positions are zero-based.'
const space = [
  'Iterative pointer walks and updates use O(1) core auxiliary space, excluding a newly inserted node and returned traversal output. Storing all traversal values requires O(n) output space. The list itself occupies O(n); doubly linked nodes store one extra reference each.',
  'The actual operation wrapper validates and copies the whole list and builds a layout array. These add O(n) time and O(n) memory even for a constant-time endpoint update. Layout splices, result copies, and saved snapshots add visualization work; endpoint labels do not describe the full Apply Operation runtime.',
]
const search = 'Searching by value is a conceptual pointer walk, not a separate implemented control: a match at HEAD is O(1), while a missing value can require O(n). Access by position also walks links; it is not array indexing.'
export const listComplexity = {
  singly: {
    name: 'Singly Linked List', variables,
    rows: [
      { label: 'Traversal', bound: 'O(n)' }, { label: 'Search by value · conceptual', bound: 'O(n)' },
      { label: 'Insert at beginning', bound: 'O(1)' }, { label: 'Insert at end', bound: 'O(n)' },
      { label: 'Insert at position', bound: 'O(n)' }, { label: 'Delete from beginning', bound: 'O(1)' },
      { label: 'Delete from end', bound: 'O(n)' }, { label: 'Delete from position', bound: 'O(n)' },
      { label: 'Core auxiliary space', bound: 'O(1)' },
    ],
    why: 'Only HEAD is maintained. End operations must walk from HEAD. Once the predecessor is found, linking or bypassing a node changes a constant number of references.',
    assumptions: [search, 'Position 0 takes constant pointer work; a general position may require a full walk. There is no TAIL or prev reference to jump to the end.'], storage: space,
  },
  doubly: {
    name: 'Doubly Linked List', variables,
    rows: [
      { label: 'Forward / backward traversal', bound: 'O(n)' }, { label: 'Search by value · conceptual', bound: 'O(n)' },
      { label: 'Insert at beginning', bound: 'O(1)' }, { label: 'Insert at end', bound: 'O(1)' },
      { label: 'Insert at position', bound: 'O(n)' }, { label: 'Delete from beginning', bound: 'O(1)' },
      { label: 'Delete from end', bound: 'O(1)' }, { label: 'Delete from position', bound: 'O(n)' },
      { label: 'Core auxiliary space', bound: 'O(1)' },
    ],
    why: 'HEAD, TAIL, prev, and next allow direct endpoint updates. A general position still needs a walk; reconnecting both neighbors afterward is constant work.',
    assumptions: [search, 'Explicit end operations start at TAIL. Position-based operations always walk forward from HEAD, even for a position near TAIL; they do not choose the nearer endpoint.'], storage: space,
  },
  circular: {
    name: 'Circular Singly Linked List', variables,
    rows: [
      { label: 'Traversal · one lap', bound: 'O(n)' }, { label: 'Search by value · conceptual', bound: 'O(n)' },
      { label: 'Insert at beginning', bound: 'O(1)' }, { label: 'Insert at end', bound: 'O(1)' },
      { label: 'Insert at position', bound: 'O(n)' }, { label: 'Delete from beginning', bound: 'O(1)' },
      { label: 'Delete from end', bound: 'O(n)' }, { label: 'Delete from position', bound: 'O(n)' },
      { label: 'Core auxiliary space', bound: 'O(1)' },
    ],
    why: 'HEAD and TAIL make inserting at either end and deleting HEAD constant pointer work. Deleting TAIL still needs its predecessor, found by walking the circle because no prev reference exists.',
    assumptions: [search, 'Stop after returning to HEAD, not at NULL. Insertion at position 0 or n uses the maintained TAIL after size validation; middle positions require traversal. A single node points to itself.'], storage: space,
  },
} satisfies Record<string, ComplexityProfile>
