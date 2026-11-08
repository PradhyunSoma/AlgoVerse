export type CategoryId = 'sorting' | 'linked-lists' | 'trees' | 'graphs'

export interface Category {
  id: CategoryId
  path: `/${CategoryId}`
  title: string
  navigationLabel: string
  description: string
  plannedDescription: string
  topics: readonly string[]
  status: 'coming-soon' | 'available'
}

export const categories: readonly Category[] = [
  {
    id: 'sorting',
    path: '/sorting',
    title: 'Sorting Algorithms',
    navigationLabel: 'Sorting',
    description: 'Discover how a little order emerges, one comparison at a time.',
    plannedDescription: 'Compare neighboring values with Bubble Sort, select the next minimum with Selection Sort, and build an ordered sequence with Insertion Sort. Then explore how Merge and Quick Sort divide the work.',
    topics: ['Bubble', 'Selection', 'Insertion', 'Merge', 'Quick'],
    status: 'available',
  },
  {
    id: 'linked-lists',
    path: '/linked-lists',
    title: 'Linked Lists',
    navigationLabel: 'Linked Lists',
    description: 'Follow the pointers. See how connected nodes store and move data.',
    plannedDescription: 'Explore traversal, insertion, and deletion in singly, doubly, and circular linked lists. Follow each pointer update and see how the connections between nodes change.',
    topics: ['Singly', 'Doubly', 'Circular'],
    status: 'available',
  },
  {
    id: 'trees',
    path: '/trees',
    title: 'Trees',
    navigationLabel: 'Trees',
    description: 'Explore branching structures, from the first root to balanced trees.',
    plannedDescription: 'Walk through binary tree traversals, search and update binary search trees, and discover how AVL rotations restore balance after an insertion or deletion.',
    topics: ['Binary Trees', 'BST', 'AVL'],
    status: 'available',
  },
  {
    id: 'graphs',
    path: '/graphs',
    title: 'Graphs',
    navigationLabel: 'Graphs',
    description: 'Find connections, explore networks, and uncover the shortest path.',
    plannedDescription: 'Explore nodes level by level with BFS, follow branches with DFS, and trace how Dijkstra’s algorithm finds shortest paths in graphs with nonnegative edge weights.',
    topics: ['BFS', 'DFS', 'Dijkstra'],
    status: 'available',
  },
]
