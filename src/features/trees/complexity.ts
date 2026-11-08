import type { ComplexityProfile } from '../../components/complexity'

const variables = 'n = number of nodes; h = tree height; w = maximum level width. Bounds describe core operations on a valid tree.'
const traversalRows = [
  { label: 'Preorder / inorder / postorder time', bound: 'O(n)' },
  { label: 'Level-order time', bound: 'O(n)' },
  { label: 'Recursive traversal stack', bound: 'O(h + 1)' },
  { label: 'Level-order live queue', bound: 'O(w)' },
  { label: 'Stored traversal output', bound: 'O(n)' },
]
const traversalStorage = 'Recursive traversals retain a root-to-current call path, including NULL calls. Level-order uses a Map queue with a moving front index and deletes dequeued entries; the live queue can span parts of two levels but stays O(w). Output and completed-node records each use O(n). Validation, call labels, copied states, and saved execution traces add overhead beyond the stack/queue bounds.'
const treeOverhead = 'The actual visualizer validates and copies all nodes, using O(n) work and storage before snapshots. BST/AVL path highlighting also scans arrays with includes, adding up to O(h²) bookkeeping time across a path. These are educational overheads, not a guarantee that the full operation wrapper runs in O(h).'
export const treeComplexity = {
  binary: {
    name: 'Binary Tree', variables,
    rows: traversalRows,
    why: 'Each traversal visits every node exactly once. Balanced trees need O(log n) recursive depth; a skewed chain needs O(n). A wide tree can require an O(n) level-order queue.',
    assumptions: ['Preorder, inorder, and postorder differ only in visit timing. General binary trees do not obey BST ordering. Here height counts edges (leaf 0); O(h + 1) also covers a single node. AVL stores node-count heights (leaf 1), which changes no asymptotic bound.'],
    storage: [traversalStorage],
  },
  bst: {
    name: 'Binary Search Tree', variables,
    rows: [
      { label: 'Search / insert / delete time', bound: 'O(h)' },
      { label: 'Minimum / maximum time', bound: 'O(h)' },
      { label: 'Balanced height', bound: 'O(log n)' }, { label: 'Skewed height', bound: 'O(n)' },
      { label: 'Core iterative walk / pointer space', bound: 'O(1)' },
      ...traversalRows,
    ],
    why: 'Comparison walks follow one branch. Two-child deletion also walks to the inorder successor, then transplants that node with constant pointer updates. Both walks fit within O(h); the tree does not rebalance itself.',
    assumptions: ['A root match takes O(1); a deep or missing key can take O(h). Sorted insertion order can create a chain. Logarithmic behavior requires a reasonably balanced shape and is not guaranteed for this BST. Empty-tree checks are constant.', 'Deletion preserves the successor’s right child and node ID. Search, extrema, insertion lookup, and deletion lookup are iterative; no recursive search stack is needed. Duplicate insertions are rejected.'],
    storage: [treeOverhead, 'The saved examined/path arrays use O(h) extra memory even though the core pointer walk needs O(1). Whole-tree duplicate checks and invariant validation add linear work. The tree itself is O(n) storage.', traversalStorage],
  },
  avl: {
    name: 'AVL Tree', variables,
    rows: [
      { label: 'Search / insert / delete time', bound: 'O(log n)' },
      { label: 'Minimum / maximum time', bound: 'O(log n)' },
      { label: 'One left / right rotation', bound: 'O(1)' },
      { label: 'Height / balance-factor lookup', bound: 'O(1)' },
      { label: 'Core iterative search space', bound: 'O(1)' },
      { label: 'Stored update path space', bound: 'O(log n)' },
      ...traversalRows,
    ],
    why: 'Maintaining balance factors in [−1, +1] bounds height by O(log n). Updates repair the ancestor path. Each rotation rewires a fixed number of links and recalculates two cached heights, preserving all subtrees.',
    assumptions: ['NULL height is 0, leaf height is 1, and balance factor is left height minus right height. Cached heights make height updates constant-time; the core rotation does not traverse its subtrees.', 'LL/RR use one rotation; LR/RL use two, still O(1) per repaired ancestor. Insertion checks the remaining ancestors after repair. Deletion transplants the actual successor and may rebalance at multiple ancestors, including the zero-balance-child case. O(log n) total core update work follows from logarithmic height.', 'Search and extrema reuse iterative BST walks. Update ancestors are stored explicitly, not via recursive search. A root match can take O(1); the displayed logarithmic bound is a worst-case guarantee for core operations on a valid AVL tree.'],
    storage: [treeOverhead, 'AVL additionally copies path prefixes during repair, adding up to O(h²) bookkeeping time. The explicit update path uses O(h) = O(log n) memory. Whole-tree validation, duplicate checks, and actual-height annotations are separate from the constant-time cached-height calculation.', traversalStorage],
  },
} satisfies Record<string, ComplexityProfile>
