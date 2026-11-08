import type { ComplexityProfile } from '../../components/complexity'

const variables = 'n = number of array values. Bounds describe growing inputs; empty and single-element cases take constant work.'
const copyStorage = 'Every exported sort preserves your input by allocating an O(n) working/result copy, even without recording a trace. Thus O(1) core auxiliary space does not mean this JavaScript function allocates O(1) total memory. Stable identities and full playback snapshots use further storage.'
const average = 'Average-case statements assume uniformly random permutations of distinct values; they are not measured averages from this example.'
export const sortingComplexity = {
  bubble: {
    name: 'Bubble Sort', variables,
    rows: [{ label: 'Best time · already sorted', bound: 'O(n)' }, { label: 'Average time', bound: 'O(n²)' }, { label: 'Worst time · reverse sorted', bound: 'O(n²)' }, { label: 'Core auxiliary space', bound: 'O(1)' }],
    why: 'A no-swap pass stops this implementation early. Already sorted values need one scan. Reverse order needs repeated scans of shrinking ranges, whose lengths sum quadratically.',
    assumptions: [average, 'The swappedInPass flag is checked after every full pass. Equal neighbors do not swap. A small value near the far right can still require many passes, so nearly sorted does not always mean one pass.'],
    storage: ['Only a swap temporary, loop indices, and a flag are needed by the core sorting procedure.', copyStorage],
  },
  selection: {
    name: 'Selection Sort', variables,
    rows: [{ label: 'Best time', bound: 'O(n²)' }, { label: 'Average time', bound: 'O(n²)' }, { label: 'Worst time', bound: 'O(n²)' }, { label: 'Core auxiliary space', bound: 'O(1)' }],
    why: 'Every pass scans all remaining candidates. The loop structure gives n(n − 1)/2 value comparisons for every ordering; sorted input avoids swaps, not comparisons.',
    assumptions: ['There is no early termination. The minimum index and one swap temporary suffice. Self-swaps are skipped; even reverse order has the same number of comparisons as sorted input.', average],
    storage: [copyStorage],
  },
  insertion: {
    name: 'Insertion Sort', variables,
    rows: [{ label: 'Best time · already sorted', bound: 'O(n)' }, { label: 'Average time', bound: 'O(n²)' }, { label: 'Worst time · reverse sorted', bound: 'O(n²)' }, { label: 'Core auxiliary space', bound: 'O(1)' }],
    why: 'Sorted input needs one comparison per key and no shifts. Reverse order shifts all earlier values for each key. Nearly sorted input has few inversions, so it needs few shifts.',
    assumptions: [average, 'The loop stops at a value less than or equal to the held key. Only strictly larger values shift, preserving stability. Total core work is O(n + I), where I is the number of out-of-order pairs (inversions).'],
    storage: ['One held key and a few indices use constant core space.', copyStorage],
  },
  merge: {
    name: 'Merge Sort', variables,
    rows: [{ label: 'Best time', bound: 'O(n log n)' }, { label: 'Average time', bound: 'O(n log n)' }, { label: 'Worst time', bound: 'O(n log n)' }, { label: 'Core auxiliary space', bound: 'O(n)' }],
    why: 'Halving creates O(log n) levels. Across each level, merging and copying process O(n) values. Sorted, reverse-sorted, and mixed arrays all keep these bounds.',
    assumptions: ['This recursive implementation always merges; it does not skip an already ordered pair of halves. Taking the left value on equality preserves stability.'],
    storage: ['One reusable O(n) buffer plus an O(log n) recursion stack gives O(n) core auxiliary space. The private result copy adds O(n), so the untraced function still uses O(n) total extra memory. Recursion diagrams, identity records, and saved snapshots add visualization storage.'],
  },
  quick: {
    name: 'Quick Sort', variables,
    rows: [{ label: 'Best time · balanced partitions', bound: 'O(n log n)' }, { label: 'Average time', bound: 'O(n log n)' }, { label: 'Worst time', bound: 'O(n²)' }, { label: 'Best / average auxiliary stack', bound: 'O(log n)' }, { label: 'Worst auxiliary stack', bound: 'O(n)' }],
    why: 'Each partition scans its range. Balanced splits give logarithmic depth; repeatedly leaving n − 1 values on one side gives quadratic work and linear recursion depth.',
    assumptions: ['Lomuto partitioning uses the last value as pivot and compares with ≤. Already sorted, reverse-sorted, and all-equal arrays produce the worst case. There is no random pivot, three-way partition, or smaller-side recursion optimization.', average],
    storage: ['Partitioning itself uses O(1) space; recursive calls supply the stack bound. Both partitions are called recursively. The O(n) private input/result copy makes total untraced extra memory O(n), even when the core stack is logarithmic. Full snapshots and recursion records add more.'],
  },
} satisfies Record<string, ComplexityProfile>
