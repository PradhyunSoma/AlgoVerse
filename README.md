# AlgoVerse

An educational algorithm visualization project built with React, TypeScript, Vite, and Tailwind CSS. The current implementation includes the Phase 1 homepage and routes, all five planned sorting visualizers, singly/doubly/circular singly linked list operations, general binary tree traversals, BST/AVL operations, graph BFS/DFS/Dijkstra, sorting comparisons, and learning-experience polish through Phase 6, Task 3.

## Run locally on macOS

Use Node.js 24 and npm. If you use nvm, run `nvm install` and `nvm use` in this folder to select the version in `.nvmrc`.

```sh
cd /Users/PradhyunSoma/Documents/ChatGPT/AlgoViz
npm ci
npm run dev
```

Open the local URL printed by Vite, usually http://localhost:5173. Press Control+C in Terminal to stop the server. `npm ci` installs the versions recorded in `package-lock.json` and is needed after cloning or when dependencies change.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server with automatic updates |
| `npm run build` | Type-check and create the production bundle in `dist/` |
| `npm run preview` | Serve the built bundle locally |
| `npm run lint` | Check TypeScript, JavaScript, and React conventions |
| `npm run type-check` | Check application, tests, and Vite configuration types |
| `npm test` | Run tests once |
| `npm run test:watch` | Rerun affected tests during development |

## Files and folders

- `index.html` contains the root element and loads `src/main.tsx`.
- `src/main.tsx` mounts React in Strict Mode inside React Router’s `BrowserRouter` and imports the global stylesheet.
- `src/app/App.tsx` defines the dashboard, sorting lessons at `/sorting`, the singly linked list at `/linked-lists`, two category placeholders, and a catch-all 404 inside the reusable `AppShell`.
- `src/app/AppShell.tsx` owns desktop and mobile navigation. `Dashboard.tsx` contains the hero, categories, learning steps, and upcoming Bubble Sort section.
- `src/app/categories.ts` provides typed paths and category information and availability for navigation, cards, and Coming Soon pages.
- `src/app/CategoryPage.tsx` renders the shared category placeholder. `NotFoundPage.tsx` handles unknown URLs.
- `src/app/styles.css` imports Tailwind CSS and defines the dark theme, responsive layout, focus styles, and reduced-motion rules.
- `src/app/App.test.tsx` verifies every route, active navigation, category links, 404 recovery, browser history, homepage content, and mobile menu behavior with React Testing Library.
- `src/test/setup.ts` adds DOM assertions and cleans up between tests.
- `src/components/` contains reusable category cards, icons, and decorative diagrams. `src/playback/` owns the shared step cursor. `src/features/sorting/` owns the Bubble Sort algorithm, trace, lesson, and tests.
- `vite.config.ts` configures React, the Tailwind Vite plugin, and Vitest's jsdom environment. Sharing this file keeps test and application transforms aligned.
- `tsconfig.json` references separate strict TypeScript configurations for browser code and tooling.
- `eslint.config.js` configures ESLint, TypeScript rules, React Hooks rules, and Fast Refresh checks.
- `package.json` defines scripts and dependency ranges. `package-lock.json` records the exact resolved dependency tree.
- `AGENTS.md` holds development conventions. `PROJECT_PLAN.md` holds the roadmap and acceptance criteria.

TypeScript 6.0.3 is the newest stable release supported by the installed typescript-eslint integration at setup time. Tailwind uses its Vite plugin and CSS import as described in the [official installation guide](https://tailwindcss.com/docs/installation/using-vite).

## Routing

React Router matches `/`, `/sorting`, `/linked-lists`, `/trees`, and `/graphs` to their pages. Other URLs show the 404 page. Links update the URL and page content through browser history. `NavLink` supplies the active navigation state. Sorting opens Bubble Sort by default, with a selector for Selection Sort, Insertion Sort, Merge Sort, and Quick Sort. Linked Lists opens the singly linked list lesson. Trees and Graphs describe their planned features. Each page links back to the dashboard.

Run `npm run dev` to check the routes locally. Try each sidebar link, a homepage category card, Back and Forward, and refreshing a category URL. On mobile, navigation closes after selecting a page, and Escape closes it with focus returned to the menu toggle.

When choosing production hosting later, configure a fallback to `index.html` for application URLs so direct visits and refreshes work. Vite handles that fallback during local development.

## Bubble Sort lesson

Open `/sorting` to step through `[5, 1, 4, 2, 8]`. The 42-step sample includes loop setup, pair selection, comparisons, swaps or keeps, pass completion, early exit, and the final sorted array. Next and Previous move exactly one saved step at a time.

- `src/features/sorting/bubbleSort.ts` copies the supplied array, sorts that copy in ascending order, and reports algorithm events through an optional observer. The caller's input stays unchanged.
- `bubbleSortTrace.ts` records independent snapshots, explanations, counters, and stable pseudocode IDs.
- `bubbleSortCode.ts` holds language-independent pseudocode lines with semantic identifiers.
- `SortingPage.tsx` connects the selected algorithm's trace to the shared cursor, bars, controls, and pseudocode panel. It retains the original valid input separately from the current snapshot. `ArrayBars.tsx` renders labeled bar states, and `BubbleSortInfo.tsx` explains Bubble Sort and its complexity.
- `src/playback/useStepPlayback.ts` manages the step index, playback state, speed, and one scheduled timer independently of sorting logic. `src/components/StepControls.tsx` provides the toolbar and progress indicator.
- `ArrayInput.tsx` owns the input form and validation feedback. `arrayValidation.ts` parses integers and generates bounded random arrays independently of React.

The sort stops after a pass with no swaps. Its best time is O(n), average and worst time are O(n²), and core working space is O(1). Copying input and recording full snapshots uses additional memory.

### Playback and inputs

Play advances one snapshot at a time and stops at completion. Replay starts again from the first snapshot. Pause cancels the pending timer immediately. Previous and Next also pause playback. Reset pauses and returns to the first step of the current array.

Normal speed waits 1 second between steps. The 0.5×, 2×, and 4× settings wait 2 seconds, 500 milliseconds, and 250 milliseconds respectively. Changing speed restarts the pending wait without changing the selected step. Timers are cleared on unmount. Reset and new arrays preserve the selected speed.

Custom input accepts 1–12 comma-separated integers from -99 to 99, including negatives, zero, and duplicates. Whitespace is trimmed. Blank entries, decimals, text, and out-of-range values produce an inline error. Invalid submissions pause playback and preserve the last valid array and current step. Valid submissions create a fresh trace, paused at its first step. Editing the text alone does not change the visualization.

Generate Random Array uses the same bounds, with a default length of 6 and selectable lengths from 1 to 12. It replaces the input text and resets playback. Negative bars extend below the zero line. Larger arrays scroll within the chart on narrow screens; focus the chart and use arrow keys for keyboard scrolling.

Tests cover timer behavior, speed changes, replay, validation, random generation, input replacement, and synchronization between the bars, explanation, and pseudocode.

### Selection Sort

Use the Algorithm selector on `/sorting` to choose Selection Sort. Switching algorithms pauses playback, preserves the speed and original valid input, generates the selected trace, and returns to the first step. Unsubmitted or invalid draft text is not used as algorithm input.

- `selectionSort.ts` implements standard ascending Selection Sort on a copy, reporting events for each pass, initial minimum, scan, comparison, minimum update, swap decision, swap or skip, sorted prefix, and completion. It never swaps an element with itself.
- `selectionSortTrace.ts` saves independent array snapshots, pass/start/scan/minimum indices, sorted-prefix length, swap indices, counters, explanations, and semantic pseudocode IDs.
- `selectionSortCode.ts` provides matching pseudocode. `SelectionSortInfo.tsx` explains the algorithm and its O(n²) best/average/worst time and O(1) core auxiliary space. Input copies and recorded snapshots use extra memory.
- `sortingPresentation.ts` maps each algorithm's metadata to bar states. Selection uses Scan, Minimum, Scan + min, Swap, and Sorted labels. The shared renderer and playback hook do not execute sorting logic.

Selection Sort scans the entire remaining range on every pass. The minimum moves to the first unsorted position, so the sorted portion grows left to right. Tests verify minimum tracking, sorted prefixes, no self-swaps, every forward/backward step, autoplay, and algorithm switching while playback is active. Existing Bubble Sort tests remain in place.

### Insertion Sort

Choose Insertion Sort on `/sorting`. The first element starts as an ordered portion. Each subsequent element is held as a key, larger elements shift right, and the key fills the resulting vacant position. Only strictly larger values shift, preserving the original order of equal elements.

- `insertionSort.ts` runs standard ascending Insertion Sort on a private copy and emits events without depending on React or timers.
- `insertionSortTrace.ts` records snapshots with a `null` vacant slot and a separate numeric key. It tracks source identities to verify stability. Every snapshot's occupied slots plus held key contain exactly the original input elements.
- `InsertionKey.tsx` displays the held key outside the bars. `ArrayBars.tsx` shows a dashed vacant slot and includes the held key when calculating the bar scale, avoiding resizing during extraction. Zero remains a valid key and is never confused with a vacancy.
- `insertionSortCode.ts` supplies stable pseudocode IDs. `InsertionSortInfo.tsx` explains shifting, stability, nearly sorted inputs, and complexity.
- `SortingPage.tsx` uses a small local algorithm catalog and the existing playback hook, controls, input form, progress bar, and code panel. Switching while a key is held still restores the entire original valid input.

The sorted portion is ordered relative to itself; later keys may shift it again. Counters show value comparisons and rightward shifts, not swaps. Best-case time is O(n), average and worst are O(n²), and the core sort uses O(1) auxiliary space. Input copies, snapshots, and identity records use additional memory in the visualizer.

Tests cover every intermediate snapshot, key selection, shift destinations, insertion positions, stable identities, all four speeds, replay/reset, switching during autoplay, custom/random input, and backward restoration. Existing Bubble Sort and Selection Sort regression tests remain in place.

### Merge Sort

Choose Merge Sort on `/sorting`. A recursion tree grows as calls are actually entered: the left call finishes before the right call begins, and both finish before their parent merges. Ranges use `[lo, hi)`, including `lo` and excluding `hi`. One highlighted node identifies the current call, and the stack shows its waiting ancestors. Cards preserve their input and completed output as historical results.

- `mergeSort.ts` implements recursive stable ascending Merge Sort on a private copy, using one reusable O(n) buffer and an O(log n) call stack.
- `mergeSortTrace.ts` saves working-array snapshots, source snapshots, buffer slots, original element identities, recursion nodes, the call stack, counters, explanations, and stable pseudocode IDs. Original identities verify that equal values retain their order.
- `MergeRecursion.tsx` renders the tree with native HTML and SVG. Its scrollable region supports keyboard navigation on smaller screens. No graph library is required for this read-only tree.
- `MergeStorage.tsx` displays fixed left/right source snapshots and temporary buffer slots. Comparisons, selected source elements, and buffer destinations have labels as well as colors.
- `mergeSortCode.ts`, `MergeSortInfo.tsx`, and `mergeSort.css` provide pseudocode, education, and matching styles. `SortingPage.tsx` and `sortingPresentation.ts` integrate Merge Sort with the existing bars and unchanged playback hook.

Buffer writes leave the working array unchanged. Once the buffer is complete, copy-back writes occur individually. The working array may briefly contain repeated values during these writes; the full sorted range remains in the buffer. The UI explains this and does not mark the range merged until copy-back finishes. Previous restores all earlier recursion, source, buffer, and working-array states.

Equal comparisons take the left value first, preserving stability. Each recursion level processes O(n) values across O(log n) levels, giving O(n log n) best, average, and worst time. The algorithm uses O(n) auxiliary space; saved visualization snapshots require additional memory.

Tests verify call/return order, partitions, stable identities, buffer writes, partial copy-back, pseudocode, forward/backward playback, speeds, replay, input replacement, and switching among all four algorithms during playback. Existing sorting regression tests remain in place.

### Quick Sort

Choose Quick Sort on `/sorting`. This implementation uses recursive Lomuto partitioning with the last element as pivot and inclusive `[low, high]` ranges. `i` starts at `low - 1`, the end of an initially empty region of values less than or equal to the pivot. `j` scans each non-pivot value. If it qualifies, `i` advances and the value moves into that position. Self-swaps are skipped. After scanning, the pivot moves to `i + 1`, then the left partition is sorted before the right.

- `quickSort.ts` implements the algorithm independently of React, on a private copy.
- `quickSortTrace.ts` records independent array and identity snapshots, pivot/boundary/scan indices, finalized positions, recursive calls, stack, counters, explanations, and stable pseudocode IDs.
- `QuickPartition.tsx` explains the boundary and shows the current pivot. The boundary-update step explicitly indicates a pending swap; it does not prematurely classify the reserved slot as less than or equal to the pivot.
- `QuickRecursion.tsx` uses a compact scrollable call-stack panel, accommodating the deep unbalanced recursion produced by last-element pivots. It follows the existing snapshot approach without changing Merge Sort's tree.
- `quickSortCode.ts`, `QuickSortInfo.tsx`, and `quickSort.css` provide matching pseudocode, education, and styles. `sortingPresentation.ts` and `ArrayBars.tsx` supply bar states and independent low/high/i/j labels.

Only placed pivots and single-element base cases are marked final. Partitioned sides are not marked sorted merely because the pivot was placed. All controls, speed settings, custom/random input, and algorithm switching use the unchanged shared playback hook. Switching restores the original valid array, pauses, and returns to the first step.

Best and average time are O(n log n); worst time is O(n²). The recursive stack needs O(log n) space on average and O(n) in the worst case. Sorted, reverse-sorted, and all-equal arrays can produce worst-case partitions with this pivot rule. Distant swaps make standard Quick Sort unstable. Input copies and visualization snapshots use additional memory.

Tests verify partition invariants, pending boundaries, pivot positions, no self-swaps, recursive call order, input preservation, instability examples, every forward/backward snapshot, autoplay, all speeds, replay/reset, input changes, and switching among all five algorithms. The other four algorithms' regression tests remain intact.

Phase 2 implementation is complete through Task 6. Comprehensive phase-by-phase audits, including the final Phase 2 review, are deferred until all development phases are complete. Regular task-level checks and immediate fixes continue. Sorting comparisons are documented under Phase 6 below.

## Singly linked list

Open `/linked-lists`. The example starts at `10 → 20 → 30 → NULL`. Choose traversal or insertion/deletion at the beginning, end, or a zero-based position, then click Apply Operation. Use the existing playback controls to inspect the generated trace. The interface accepts up to 8 nodes with integer data from -99 to 99, including duplicates.

- `src/features/linked-lists/listModel.ts` defines a node table, stable IDs, actual `next` references, HEAD, and a monotonically increasing ID counter. Walking the list follows references, not table order. Complete states reject cycles, dangling references, and unreachable nodes.
- `listOperations.ts` validates requests and runs operations on private nodes independently of React. Insertion links the new node to its successor before changing HEAD or the predecessor. Deletion holds the target, bypasses it, and then releases it. Empty beginning/end deletions are explained no-ops; invalid position deletions are rejected.
- `listTrace.ts` captures independent node/pointer snapshots, local references, traversal output, explanations, and stable pseudocode IDs. A detached node is explicitly held by `newNode` or `target` until connected or released. A removed card is a labeled historical marker, no longer a live node.
- `ListDiagram.tsx` renders data and next fields with SVG arrows resolved from actual node IDs. Labels distinguish current, previous, new, detached, removed, and changed-pointer states. Longer diagrams scroll horizontally and support keyboard access.
- `LinkedListPage.tsx` owns the selected operation and a saved checkpoint. It reuses `useStepPlayback`, `StepControls`, and `PseudocodePanel`; the playback hook is unchanged. `listCode.ts`, `LinkedListInfo.tsx`, and `linkedList.css` provide pseudocode, explanations, complexity notes, and feature styling.

A result becomes the saved list when its final step is reached. Previous, Reset, and Replay inspect the operation's history without applying it twice or undoing that saved checkpoint. Apply always starts from the saved list. Switching operations pauses playback and discards an unfinished preview. While playing, Apply, value/position inputs, Clear List, and Restore Example are disabled; the operation selector can cancel playback. Invalid submissions preserve the saved list, trace, and step. Clear and Restore replace the saved list and pause at a fresh ready state. State is local to this page and is not persisted across reloads or leaving the route.

Tests cover all insertion/deletion positions, empty/singleton lists, duplicate/negative values, pointer-update order, cycles and ownership, stable identities, independent snapshots, pseudocode synchronization, exact backward restoration, speeds, autoplay cancellation, completion, replay, and operation chaining. All sorting regression tests remain in place.

## Doubly linked list

Choose Doubly Linked List from the List type selector on `/linked-lists`. Switching pauses playback, keeps the last saved values and stable node IDs, and starts a ready trace with no stale highlights. An unfinished operation is discarded; the committed list is converted between models without applying a mutation. The existing input limits and Clear/Restore actions apply to both types.

- `doublyListModel.ts` adds `prev` to each node and maintains HEAD and TAIL. Complete states require reciprocal neighbors, `head.prev = NULL`, `tail.next = NULL`, and identical forward/backward node sets in opposite order. Conversion keeps IDs and their allocation counter.
- `doublyListOperations.ts` validates and executes eight operations on private state: forward/backward traversal, three insertions, and three deletions. End operations use TAIL directly; position operations walk forward from HEAD.
- `doublyListTrace.ts` snapshots every individual pointer write, including endpoint changes, temporary locally held nodes, visited data, explanations, and stable code IDs.
- `DoublyDiagram.tsx` renders three-field nodes, HEAD/TAIL references, and distinct forward/next and backward/prev arrow lanes. During a partial update, labels and both chain summaries identify nodes reachable only in one direction. Detached nodes remain explicitly held; removed cards are historical markers.
- `doublyListCode.ts` and `DoublyListInfo.tsx` provide matching pseudocode and complexity explanations. `LinkedListPage.tsx` reuses its existing form, checkpoint behavior, playback hook, controls, and code panel for both list types. No timing logic is duplicated.

Insertion initializes the new node's prev/next, reconnects its left neighbor or HEAD, then reconnects its right neighbor or TAIL. Deletion bypasses the target in each direction, updates the endpoints as needed, clears the target links individually, and releases it. Intermediate snapshots deliberately permit nonreciprocal links; complete results validate all reciprocal invariants.

Maintaining TAIL gives O(1) beginning/end insertions and deletions in the list algorithm. Traversals and arbitrary position lookups take O(n). A second reference per node adds memory overhead while total node storage stays O(n). Validation, copying, rendering, and stored snapshots add visualizer overhead.

Tests cover all positions and endpoints, empty/singleton cases, duplicate/negative values, both traversal orders, reciprocal invariants, individual pointer writes, exact backward playback, all speeds, replay/reset, commit-once behavior under React Strict Mode, invalid edits, and switching types during autoplay. Singly linked list and sorting regressions remain covered.


## Circular singly linked lists · Phase 3, Task 3

Select **Circular Singly Linked List** on `/linked-lists`. The initial example is `10 → 20 → 30 → HEAD`.
Each node has a stable ID, numeric value, and next reference; HEAD and TAIL identify the endpoints. A nonempty list satisfies `TAIL.next === HEAD`, a single node points to itself, and an empty list has NULL endpoints. Traversal reads each node once and stops on returning to HEAD.

- `circularListModel.ts` validates complete cycles and provides bounded inspection of intermediate pointer states. Conversions preserve committed values, IDs, and the allocation counter; they explicitly open or close the last link.
- `circularListOperations.ts` implements traversal and insertion/deletion at the beginning, end, or a zero-based position. It operates on a private copy and reports each pointer assignment in actual order.
- `circularListTrace.ts` copies those events into independent snapshots. `CircularDiagram.tsx` renders actual references, a lower return arrow or self-loop, endpoint changes, detached nodes held locally, and removed-node markers. Temporary return edges have separate lanes.
- `circularListCode.ts` supplies stable pseudocode IDs; `CircularListInfo.tsx` explains circular traversal, pointer updates, round-robin applications, and complexity.
- `LinkedListPage.tsx` reuses the existing playback hook and controls unchanged. Completing an operation saves its result once. Reset/Replay only revisit history. Switching types cancels playback, discards unfinished previews, and converts the last saved list.

Limits remain 8 nodes with integers from -99 to 99. Invalid edits preserve the saved list and preview. Core insert-beginning, insert-end, and delete-beginning operations take O(1) with maintained endpoints; delete-end and general position-based operations require O(n) traversal. Validation and educational snapshots add overhead beyond these pointer-operation bounds.

Task-level tests cover all valid insertion/deletion positions for lists of size 0–7, full-list rejection, independent cycle invariants, pointer-write order, input preservation, pseudocode, forward/backward playback, four speeds, reset/replay, chaining, and type switching during autoplay. Existing sorting and linear-list tests remain in the full suite. Desktop and mobile verification are part of this task; comprehensive phase audits remain deferred. The next tree task requires separate approval.


## Binary tree traversals · Phase 4, Task 1

Open `/trees` for a **general binary tree**, without BST ordering constraints. Preorder, inorder, postorder, and level-order reuse the shared Play/Pause, Next/Previous, Reset/Replay, speed, and progress controls. Valid input or traversal changes cancel playback and reset to step zero. Invalid input pauses at the existing step and preserves the last valid tree.

Input uses **queue-based level order**: the first token is ROOT, then each non-NULL parent consumes up to two tokens for its left and right children. NULL occupies a child slot but never enters the parent queue. Omitted final children are NULL. Thus `1, null, 2, 3` means ROOT 1 has right child 2, whose left child is 3. Extra entries after all available parent slots—including extra NULL entries—are rejected. Empty input or `null` produces an empty tree. Limits: 15 nodes, 31 tokens, integer values -99 to 99. Replacing the tree assigns fresh IDs from its allocation counter; traversal changes preserve IDs.

The initial example `1, 2, 3, 4, 5, null, 6` yields:

| Traversal | Output |
| --- | --- |
| Preorder | 1, 2, 4, 5, 3, 6 |
| Inorder | 4, 2, 5, 1, 3, 6 |
| Postorder | 4, 5, 2, 6, 3, 1 |
| Level-order | 1, 2, 3, 4, 5, 6 |

Tree modules live in `src/features/trees/`:

- `treeModel.ts`: references, validation, parsing, and a frozen private topology copy.
- `treeTraversals.ts`: independent recursive traversal and queue-based BFS events. A Map with advancing front/back indices supports dequeue without shifting an array or retaining processed queue entries.
- `treeTrace.ts`: immutable visual snapshots. Every step stores output IDs, current node, completed nodes, stack/queue, transition, explanation, and a stable pseudocode line ID. The unchanged frozen tree is shared safely between steps.
- `treeLayout.ts` and `TreeDiagram.tsx`: deterministic inorder-rank columns and depth rows, labeled left/right edges and NULL references. Layout is independent of playback. Wide/deep trees scroll inside a focusable region; no graph dependency is needed for this non-draggable view.
- `TreeMemory.tsx`, `treeCode.ts`, and `TreeInfo.tsx`: call-stack/queue rendering, pseudocode, and educational content.
- `BinaryTreePage.tsx` and `trees.css`: input, selector, shared playback integration, and scoped styling.

An entering recursive call does not append output. NULL calls are shown and return immediately. A return snapshot still displays the exiting frame; the next snapshot shows the caller resuming. Completed recursive nodes represent completed subtrees. For BFS, “Processed” means that node's children have been checked; queued descendants may remain unfinished.

Task-level tests cover the four required example sequences, empty/singleton/full/skewed/uneven trees, duplicates and negatives, invalid inputs and malformed models, deterministic immutable snapshots, exact stack/queue progression, stable layout, all playback speeds, mode switching, and existing routes/list/sorting regressions. BST and AVL behavior are documented below; graph BFS is documented below. Comprehensive phase audits remain deferred.

## Binary Search Tree · Phase 4, Task 2

On `/trees`, choose **Binary Search Tree**. The initial insertion sequence is `40, 20, 60, 10, 30, 50, 70`. Select Insert, Search, Delete, Find minimum, Find maximum, or any of the four traversals. Apply Operation prepares the selected operation; Next or Play executes its snapshots. Traversal selection prepares its trace immediately. Clear Tree followed by sequential insertions builds a custom BST. Limits: 15 nodes and whole numbers from -99 to 99. Duplicate insertions are rejected with feedback.

General binary trees and BSTs retain **separate saved states**. Changing types stops playback and discards unfinished previews without converting either tree. A mutation becomes the saved BST only at its final step. Reset, Previous, and Replay inspect recorded history without applying or undoing that checkpoint. A subsequent operation starts from the saved tree. During autoplay, inputs, Apply, Clear, and sample restoration are disabled; changing the operation or tree type safely cancels playback. Invalid requests preserve the saved tree and preview. Saved trees are page-local, not persisted after reload or leaving `/trees`.

BST modules live in `src/features/trees/bst/`:

- `bstModel.ts` validates strict ordering throughout both subtrees and shares the general model's reference/reachability validation. Stable IDs are independent of values; only removed nodes lose their identities.
- `bstInsert.ts`, `bstSearch.ts`, `bstDelete.ts`, and `bstExtrema.ts` perform operations on `BSTContext`'s private working copy, independently of React and timers.
- `bstTrace.ts` records immutable snapshots with node references, comparison paths, current/target/successor IDs, local references, individual pointer writes, results, explanations, and stable pseudocode IDs.
- `bstLayout.ts` arranges intermediate forests using the existing tree layout. `TreeDiagram.tsx` renders actual edges and labels detached components as held locally. Search and traversal keep node positions stable; mutations recalculate positions when structure changes.
- `BSTPage.tsx` reuses the unchanged playback hook, controls, pseudocode panel, traversal traces, and stack/queue display. `TreesPage.tsx` owns the two saved trees. `bstCode.ts`, `BSTInfo.tsx`, and `bst.css` provide matching pseudocode, education, and scoped styling.

Deletion of a leaf replaces its incoming reference with NULL. Deletion with one child promotes the entire child subtree. With two children, the implementation **transplants the inorder successor node**, rather than copying its value. The successor's right child replaces it at its old position; the successor then receives the target's incoming reference and remaining subtrees. The immediate-right-child case preserves the successor's own right subtree. Temporary detachments are shown as local references, with one pointer assignment per step; they are not labeled completed BSTs. Only the final result must satisfy full ordering and reachability invariants.

Core search, insertion, deletion, minimum, and maximum take O(h), where h is tree height; balanced trees have O(log n) height, but skewed trees can have O(n) height. An ordinary BST does not automatically balance itself. All traversals take O(n), and inorder produces ascending values. Validation, copying, and stored educational snapshots add visualizer overhead beyond the core operation bounds.

Task-level automated checks cover empty/singleton trees, signed values, duplicates and limits, all deletion cases (including a deep successor with a right subtree), exact pointer snapshots, stable identities, independent ordering/reachability invariants, pseudocode, all playback speeds, commit-once chaining, separate type states, traversal reuse, and regressions in existing modules. Manual checks include desktop/mobile layout and insertion/deletion/traversal interactions. AVL insertion/deletion and rotations are documented below, followed by Phase 5 Task 1. Later graph tasks require separate approval.


## AVL Tree · Phase 4, Task 3

On `/trees`, choose **AVL Tree**. The initial sequence is `40, 20, 60, 10, 30, 50, 70`. Select insertion, deletion, search, minimum, maximum, or one of the four existing traversals. Insert/Delete/Search prepares an operation; Next or Play advances its trace. The sample restoration, Clear Tree, speed, progress, and all existing playback controls are available. Limits remain 15 nodes and integer values from -99 to 99; duplicate insertions are rejected.

All three tree types keep independent saved trees. Switching types cancels playback, clears previews, and retains keyboard focus on the selector. Completing a mutation saves its result once; Reset, Previous, and Replay inspect history without applying or undoing that checkpoint. An unfinished preview is discarded on operation/type changes. Invalid requests preserve both the saved tree and preview. Data remains local to the mounted tree page, not persistent storage.

**Height convention:** NULL has height 0; a leaf has height 1. Each node stores `height = 1 + max(height(left), height(right))`. Balance factor is `height(left) - height(right)` and must be -1, 0, or +1 at completion. The diagram shows stored height and balance from the current structure. A `*` marks a cached height awaiting an algorithm update; a separate note gives its actual structural height. Temporary pointer-write snapshots can contain detached components or imbalance and are never presented as completed AVL trees.

**Rotation presets** replace the saved AVL with the first two values and prepare insertion of the third: LL `30,20,10`, RR `10,20,30`, LR `30,10,20`, RL `10,30,20`. All values run through the actual AVL algorithm. LL rotates right; RR rotates left; LR rotates the left child left and the ancestor right; RL rotates the right child right and the ancestor left. Double rotations have separate numbered panels. Each rotation identifies the old root, pivot, middle subtree, and parent connection, shows individual pointer writes, and updates the lower node’s height before the promoted pivot’s height. IDs and inorder ordering are preserved.

Insertion reuses the BST comparison walk and allocation, then checks the affected path bottom-up. Deletion reuses successor transplantation, preserving the successor’s right subtree. After a two-child deletion, it repairs the successor’s former ancestors, the successor at its new position, and higher ancestors. Deletion may rotate at multiple ancestors. A heavy child with balance factor zero chooses a single rotation. Only affected ancestors are repaired; the algorithm does not rebalance every node or reconstruct the entire tree.

AVL modules live in `src/features/trees/avl/`:

- `avlModel.ts`: AVL node/tree types, height/BF helpers, validation, immutable copies, structural metrics, and preset sequences.
- `avlContext.ts`: private working copy and events, extending the existing BST operation context with height/rotation metadata.
- `avlInsert.ts`, `avlDelete.ts`, `avlRebalance.ts`, and `avlRotations.ts`: updates, affected-path repair, and individual rotation pointer assignments.
- `avlOperations.ts`: validation, dispatch, and construction through real insertion. Search and extrema call existing BST algorithms unchanged.
- `avlTrace.ts`: deterministic frozen snapshots and an adapter to existing traversal traces, preserving AVL height metadata.
- `AVLDiagram.tsx` and `AVLRotationPanel.tsx`: node metrics, rotation roles, held references, pointer writes, and ancestor repair path. The existing SVG renderer and forest layout are reused with optional annotations; unannotated general trees and BSTs retain their presentation.
- `AVLPage.tsx`, `avlCode.ts`, `AVLInfo.tsx`, and `avl.css`: controls, pseudocode, explanations, and scoped styles. The shared playback hook is unchanged.

AVL balance guarantees O(log n) core search, insertion, deletion, minimum, and maximum. One rotation takes O(1); the stored update path takes O(log n) space. Search here is iterative; recursive search would use O(log n) stack space. Traversals take O(n). Validation, copying, path labels, snapshot recording, and presentation metrics add visualizer overhead. Color transitions respect reduced motion; discrete pointer snapshots always remain inspectable.

Task-level tests independently verify BST order, reachability, node identities, correct stored heights, and AVL balance after mutations. Coverage includes all insertion/deletion rotation cases, a nonempty moved middle subtree, successor cases, deletion at multiple ancestors, deterministic mutation chains, immutable intermediate states, exact forward/backward layout and metrics, pseudocode, four speeds, commit-once replay, input errors, and independent tree-type switching. Existing tree, sorting, and linked-list regressions remain in the full suite.

Phase 4 implementation is complete through Task 3. Comprehensive phase-by-phase audits remain deferred until all development phases are implemented. Phase 5 Task 1 graph editing and BFS are documented below; later tasks require user approval.


## Graph and BFS · Phase 5, Task 1

Open `/graphs` to explore Breadth-First Search. The undirected sample has vertices A–F and edges A-B, A-C, B-D, B-E, C-F, E-F. Starting at A, alphabetical neighbors produce **A → B → C → D → E → F**, with distances 0, 1, 1, 2, 2, 2. BFS only explores vertices reachable from the selected start; it reports remaining vertices as unreachable after completion.

The editor accepts comma-separated vertex labels and one `source-destination` edge per line. Blank edge lines are ignored. Labels are case-insensitive on input and normalized to uppercase; use 1–4 letters/digits beginning with a letter. Limits are **10 vertices and 20 edges**. Self-loops, duplicate labels/edges, malformed pairs, and unknown references are rejected. In directed mode `A-B` means A → B; A-B and B-A can coexist. In undirected mode they represent one connection and duplicates are rejected. Remove a vertex's incident edges along with its label. Isolated vertices need no edge entries.

Draft changes apply together on **Apply Graph**. Retained labels and connections keep their stable IDs; removed identities are not recycled. Mode changes follow the draft's source/destination order. A valid edit pauses playback and starts a fresh trace, retaining the start when possible or choosing the first alphabetical vertex. Invalid input pauses and preserves the exact valid preview. Restore Sample returns to the sample with start A; Clear Graph produces a valid empty graph. Data is page-local and resets on reload or route exit.

BFS marks a vertex discovered before adding it to the queue. The separate discovery and enqueue snapshots deliberately show the brief pending-enqueue state. Parent/distance recording is also explicit. Dequeue selects the active vertex; Visit appends it to the output; Processed means all outgoing neighbors were inspected. The queue's front cursor advances without shifting the array. Alphabetical order uses uppercase ASCII labels (digits before letters within a label), independent of input ordering.

Every immutable snapshot contains the queue, discovered IDs, visit order, processed IDs, active vertex, inspected edge/neighbor, parent/distance records, BFS tree edges, explanation, and pseudocode ID. The frozen graph is shared across snapshots. Previous and Reset restore historical state without simulating BFS again. Play/Pause/Replay, speeds, progress, and timer cleanup reuse the existing shared playback unchanged.

Modules in `src/features/graphs/`:

- `graphModel.ts`, `graphInput.ts`: typed vertex/edge identities, structure validation, immutable copies, input policies, and identity-preserving edits. Edge endpoints are independent of future weight metadata.
- `graphAdjacency.ts`: adjacency construction and deterministic neighbor ordering, reusable for future algorithms.
- `bfs.ts`, `bfsTrace.ts`, `bfsCode.ts`: independent algorithm events, frozen snapshots, and stable pseudocode definitions.
- `graphLayout.ts`, `GraphDiagram.tsx`: deterministic convex SVG placement, directed arrowheads, separate reciprocal lanes, labeled states, inspected edges, and the BFS tree. Positions stay fixed across playback and start changes. Small screens scroll within a keyboard-focusable diagram; color transitions respect reduced motion.
- `GraphEditor.tsx`, `BFSQueue.tsx`, `GraphResults.tsx`, `GraphInfo.tsx`: editor, front/rear queue, adjacency/parent/distance records, and educational content.
- `GraphsPage.tsx`, `graphs.css`: route screen, shared controls, and scoped styling.
- `bfs.test.ts`, `GraphsPage.test.tsx`: algorithm/model/layout and user interaction tests, including exact backward snapshots, all speeds, graph/start switching during playback, input errors, and unmount timer cancellation.

Core adjacency-list BFS is O(V + E) time and O(V) auxiliary space, where V counts vertices and E counts edges. Sorting adjacency lists is preprocessing with up to O(E log V) cost. Capturing full educational snapshots adds memory/time beyond core BFS; graph storage itself is O(V + E). Without a trace observer, the algorithm skips snapshot construction.

Task 2 adds DFS as documented below; Task 3 adds weighted Dijkstra behavior as documented below. Routine checks include the full regression suite, build, lint, type checking, and desktop/mobile browser verification. Comprehensive phase audits remain deferred until all development phases are implemented.


## Depth-First Search · Phase 5, Task 2

On `/graphs`, choose **Depth-First Search (DFS)** in the Algorithm selector. The existing graph editor, directed/undirected mode, start selector, sample restoration, clearing, validation, and input limits are shared with BFS. Switching algorithms preserves both the valid graph and start, cancels autoplay, and creates a fresh trace at step zero. Draft editor content also remains intact. No new dependencies are used.

DFS is genuinely recursive: each call marks its vertex discovered before exploring neighbors, records its visit, checks outgoing neighbors alphabetically, and calls DFS on an undiscovered neighbor immediately. The caller waits for that entire branch before resuming. Discovery prevents duplicate calls through cycles. Only vertices reachable from the selected start are explored.

For the restored undirected sample starting at A:

| Record | Order |
| --- | --- |
| BFS visit order | A, B, C, D, E, F |
| DFS discovery order | A, B, D, E, F, C |
| DFS completion/return order | D, C, F, E, B, A |

**Call-stack convention:** an entry snapshot shows the newly pushed frame just before its first instruction marks discovery. The following discovery snapshot records the parent and tree edge. Visiting appends the vertex to discovery output. A return snapshot shows the exiting frame's final instruction; it is not yet labeled processed. Once the recursive function actually returns, the caller records completion with the frame absent, then emits a backtrack snapshot before continuing its neighbor loop. The root returns to the traversal driver; the final stack is empty. This convention makes return boundaries inspectable without keeping completed calls on the stack.

The diagram distinguishes undiscovered, entering, active, suspended/on-stack, returning, and processed states with visible labels. DFS tree edges, the active path, inspected edges, exited vertices, and the caller receiving control are highlighted. Cyan return highlights describe control flow, not traversal of a reverse edge: directed DFS still follows only outgoing edges. Node positions and IDs remain stable. The stack is keyboard-focusable and scrolls when needed; reduced-motion styling remains supported.

The results panel labels discovery order separately from completion order, lists parents and DFS tree connections, and reports unreachable vertices at completion. DFS does not generally produce shortest paths, so its results do not reuse BFS distance values. The educational panel explains recursion, stack depth, cycles, backtracking, and the sample's differing traversal orders.

Important modules in `src/features/graphs/`:

- `dfs.ts`: React-independent recursive algorithm, actual call frames, and ordered observer events. Without an observer, no snapshots are constructed.
- `dfsTrace.ts`: deeply frozen snapshots of the stack, return metadata, discovery/output/completion order, parents, tree edges, active vertex, neighbor/edge, explanations, and stable pseudocode IDs. The immutable graph is shared between steps.
- `dfsCode.ts`, `DFSInfo.tsx`: matching recursive pseudocode and education. The completion hook is explicitly annotated as call-exit bookkeeping.
- `DFSStack.tsx`: live calls, waiting/executing/returning labels, current call, and return-to-caller explanation.
- `graphStep.ts`: the BFS/DFS trace union and shared node-state presentation.
- `GraphDiagram.tsx`, `GraphResults.tsx`: shared graph/adjacency rendering with algorithm-specific stack/queue states and results. `GraphResults` replaces the formerly BFS-only results component.
- `GraphsPage.tsx`, `graphs.css`: algorithm selection and scoped stack/return styling. Graph models, editing, layout, BFS logic, and the shared playback hook are preserved.
- `dfs.test.ts`, `DFSPage.test.tsx`: algorithm and interaction tests including all return boundaries, deterministic order, identity/input preservation, directed/disconnected/cyclic cases, maximum-depth chains, immutable snapshots, exact backward restoration, all speeds, safe switching/editing, and timer cleanup. Existing BFS tests continue to run unchanged.

Adjacency-list DFS takes O(V + E) core time and O(V) auxiliary space; a chain can require O(V) recursive depth. Shared alphabetical sorting is preprocessing, up to O(E log V). Stored full execution traces and graph/rendering data add overhead beyond the core algorithm's bounds.

Phase 5 Task 2 ends here. Task 3 adds Dijkstra with nonnegative weights, distance relaxation, and path reconstruction as documented below. Comprehensive phase audits remain deferred; routine checks and immediate fixes continue.


## Dijkstra’s Algorithm · Phase 5, Task 3

On `/graphs`, select **Dijkstra’s Algorithm**. Algorithm changes retain your current valid graph and source, stop playback, and reset to step zero. Click **Restore Sample Graph** to load the requested five-vertex weighted example: `A-B: 4`, `A-C: 1`, `C-B: 2`, `B-D: 1`, `C-D: 5`, `D-E: 3`, `B-E: 7`. Source defaults to A and destination to E on restoration. Expected distances are A=0, B=3, C=1, D=4, E=7; the A-to-E route is **A → C → B → D → E**, cost **7**.

All graph edges now store a numeric weight independently of stable edge identity. The same editor accepts `A-B: 4`; omitted weights default to 1. Accepted weights are finite integers **0–99**, including zero. Negative values, fractions, non-finite names, exponent/hex notation, and an empty value after a colon are rejected. Limits remain 10 vertices and 20 edges. Self-loops and parallel/duplicate endpoint pairs are rejected regardless of weight; reciprocal directed edges remain distinct. Invalid edits pause and preserve the exact valid preview. BFS and DFS retain weights and continue treating edges as unweighted. Draft text remains intact when switching algorithms.

Dijkstra uses a small binary min-heap. Priorities compare distance, then alphabetical label, stable vertex ID, and insertion sequence. The queue panel shows the **actual heap array**, with parent indices, the minimum root, new candidates, and stale entries. It is not a sorted queue approximation. A strict improvement inserts a new candidate; older entries stay until extracted and skipped. Equal-cost alternatives never replace a predecessor. No vertex is finalized twice.

Trace steps explicitly separate initialization, source distance, heap creation/insertion, extract-min, stale checks/skips, finalization, edge inspection, alternative calculation, comparison, distance update, predecessor update, new candidate insertion, unsuccessful relaxation, and completion. Distances are numeric Infinity internally and display as ∞. During the snapshot between a distance update and its predecessor update, the table says **Update pending**. Tentative predecessor edges are dashed; they are not presented as final shortest routes.

Select a destination to inspect its path without restarting the trace; this pauses playback. A route appears only when that destination has been finalized. Reconstruction follows predecessor references backward, verifies edge direction, checks for cycles/incomplete chains, reverses the result, and verifies the sum of edge weights equals the recorded distance. Source=destination yields a single vertex at cost 0 after source finalization. Unreachable destinations are reported only after completion. Rewinding to an earlier tentative state removes the finalized path display.

The existing SVG renderer adds weight plaques, distance labels, tentative/finalized/current states, predecessor and successful-relaxation edges, and the selected shortest route. Label placement is deterministic and avoids label/node and label/label overlap, with leader lines for offsets. Keyboard-scrolling and reduced-motion behavior remain available. No graph library was added.

Important modules in `src/features/graphs/`:

- `graphWeights.ts`, `graphModel.ts`, `graphInput.ts`: weight policy, shared types, validation, and identity-preserving parsing.
- `minHeap.ts`: independent binary min-heap with actual array snapshots.
- `dijkstra.ts`, `dijkstraTrace.ts`, `dijkstraCode.ts`: core algorithm, frozen execution snapshots, and synchronized stable pseudocode IDs.
- `shortestPath.ts`: safe reconstruction of finalized routes.
- `PriorityQueue.tsx`, `DijkstraDistances.tsx`, `RelaxationPanel.tsx`, `ShortestPathPanel.tsx`: heap, distance/predecessor table, calculation, and destination/path UI.
- `weightLabels.ts`, `GraphDiagram.tsx`, `graphLayout.ts`, `graphStep.ts`: shared SVG geometry, label placement, and state presentation.
- `GraphsPage.tsx`, `GraphEditor.tsx`, `graphs.css`, `DijkstraInfo.tsx`: selector/editor integration, styling, and education. Existing shared playback is unchanged.
- `dijkstra.test.ts`, `DijkstraPage.test.tsx`: model/heap/trace/path and interaction tests, including the exact sample, zero-weight cycles, equal alternatives, stale entries, independent exhaustive simple-path costs on small graphs, immutable snapshots, exact reverse restoration, all speeds, switching, invalid edits, and route gating.

The simple-graph adjacency-list algorithm with a binary heap and lazy duplicates uses the usual **O((V + E) log V)** time bound. There are O(E + 1) heap entries in the worst case and O(V) distance/predecessor/finalized state, for O(V + E) working memory. Heap operations are O(log(E + 1)); without parallel edges E ≤ V². Alphabetical adjacency preprocessing is O(E log V). Input copies, rendering, path inspection, and full recorded snapshots add overhead beyond core Dijkstra; no observer means no snapshot construction.

Phase 5 implementation is complete through Task 3. Phase 6 development is documented below. Comprehensive phase audits remain deferred until all development phases are implemented; regular checks and immediate fixes continue.


## Complexity explanations · Phase 6, Task 1

Every completed sorting, list, tree, and graph lesson now has a consistent **Time and space complexity** panel. Summaries and “Why?” explanations remain visible. Open **Implementation assumptions and storage** (mouse, touch, or keyboard) for implementation-specific details.

- Sorting covers best, average, worst, and auxiliary bounds, including Bubble Sort’s actual early exit, Selection Sort’s fixed comparison scan, Insertion Sort’s shifts/inversions, Merge Sort’s reusable buffer and unconditional merging, and last-pivot Lomuto Quick Sort’s skewed and all-equal cases. Average sorting bounds explicitly assume random permutations of distinct keys.
- Lists distinguish HEAD-only singly lists from maintained HEAD/TAIL in doubly and circular lists. Each insertion/deletion position is listed separately. Searching is clearly conceptual, not a newly implemented control. Core endpoint pointer work is separated from linear validation/copying/layout work in the real wrapper.
- Trees define n, h, and w; compare unbalanced BST O(h) with AVL O(log n); explain actual successor transplantation, cached-height rotations, iterative search, explicit update paths, traversal stacks, live queues, and stored output. Path bookkeeping and whole-tree validation are not hidden inside a claimed logarithmic total runtime.
- Graphs define V and E, separate adjacency preprocessing from BFS/DFS traversal, and retain the actual lazy-duplicate binary-heap bound for Dijkstra. Path reconstruction’s defensive array scans are documented separately from the algorithm.
- Theoretical growth rates are not exact measured counts. Playback steps include teaching events; no comparisons dashboard, runtime benchmark, or operation counter is introduced.

`src/components/complexity.ts` defines the typed metadata contract. `ComplexityPanel.tsx` and `complexity.css` supply the shared presentation. Each feature owns a `complexity.ts` catalog; existing Info components retain their explanatory content and embed the shared panel. Algorithm modules do not import educational metadata.

Tests cover all 14 views through their actual routes/selectors, expanded details, preservation of playback state, expected bounds, and executable guards for early exit, scans, shifts, merging, pivots, endpoint walks, and stale heap candidates. Phase 6 Task 2 is implemented below. Comprehensive phase audits remain deferred.


## Sorting comparisons · Phase 6, Task 2

Open `/sorting` and choose **Compare**. The default is Bubble Sort and Quick Sort. Select two or three different algorithms, enter a shared array, or use a preset. Inputs keep the existing limits: 1–12 integers from −99 to 99. Each trace receives an independent copy of the same original. Invalid input keeps the current comparison and pauses playback. Switching views preserves valid values and cancels the old timer, but restarts the lesson with that view’s default algorithm selections.

**Counting convention:** count actual value/key/pivot comparisons, excluding loop/index checks. A real swap between distinct positions is one swap and two main-array writes; equal-valued swaps still count, skipped self-swaps do not. Insertion Sort shifts each count as one write, and each key placement counts as one write even if it writes the same value back. Merge Sort writes of numeric values to its buffer are separate from copy-back main-array writes. Initial input/result copies, buffer allocation/null clearing, local assignments, identity tracking, and snapshot creation are excluded. These are data-operation counts, not all JavaScript assignments or timings.

**Playback policy:** one timer drives a separate bounded cursor per trace. Each Next/tick advances unfinished traces once and holds completed traces. Previous moves each cursor back once where possible, including a completed trace; it is not global history undo of ticks where that trace stayed still. Reset rewinds all. Replay starts all from zero. Every panel reads array, explanation, progress, and cumulative metrics from its own snapshot; autoplay stops when all traces finish. Trace lengths differ because teaching events differ, not because a step is a unit of equal computational work.

The final comparison table shows input size, comparisons, swaps, main-array and buffer writes, separate trace lengths, and theoretical case/space bounds. Input-specific insights explain the actual totals without claiming a universal winner. Insertion’s held key, Merge’s sources/buffer/division tree, and Quick’s partition/call stack remain real algorithm states. Two-column desktop panels and wider three-column layouts stack on smaller screens; diagrams and summary tables have keyboard-scrollable overflow. Existing reduced-motion styles apply to the reused bars.

Important modules:
- `sortingCatalog.ts`: existing algorithm/trace/code/lesson registry shared by both views.
- `operationMetrics.ts`: typed cumulative event instrumentation; each existing trace records immutable metric snapshots.
- `comparison.ts`: isolated run construction, input presets, and metric-based insights.
- `SortingPage.tsx`: accessible tabs and shared valid input. `SortingVisualizer.tsx` retains the original single lesson.
- `SortingComparison.tsx`, `ComparisonPanel.tsx`, `ComparisonMetrics.tsx`, `ComparisonSummary.tsx`, `comparison.css`: comparison orchestration, renderers, counters, summary, and responsive styling.
- `useStepPlayback.ts`: shared one/multi-trace timer engine with the existing single-trace wrapper.
- `comparison.test.ts`, `SortingComparison.test.tsx`, `useTracePlayback.test.tsx`: hand-computed counts, snapshot/state restoration, independent completion, timers, edits, tab switching, and keyboard tests.

Phase 6 Task 2 ends here. Task 3 polish is documented below. Comprehensive final phase audits remain deferred.


## Learning experience polish · Phase 6, Task 3

Open **Code Visualizer** in the desktop sidebar or mobile menu, or visit `/code-visualizer`. The Coming Soon page and dashboard card describe future capabilities. The preview is static, uses plain-language instructions, and runs no code. Phase 7's programming language is undecided.

Shared playback now communicates Ready/Paused/Playing/Complete and accessible step progress. Reset pauses and rewinds the current trace; Replay restarts a completed trace. Automatic explanation updates are not live-announced on every tick; pause or step manually to inspect the current explanation. Validation alerts remain active. Algorithm and mutation-commit semantics are unchanged.

Mobile controls have comfortable minimum heights; wide diagrams and comparison tables remain locally scrollable. The operating-system reduced-motion preference disables nonessential animations/transitions while preserving step updates. Completed comparison panels avoid repeated renders while other traces progress; tree position lookups reuse an unchanged layout. No dependencies were added.

Before Phase 7, agree on the language and execution/tracing scope. Comprehensive phase-by-phase audits remain deferred until Phase 7 is implemented.


Task 3 verification: type-check and lint passed; all 609 tests across 39 files passed; production build passed with the existing >500 kB chunk advisory. Browser checks covered the new route, reload, Back/Forward, mobile keyboard navigation, 404 recovery, stacked comparisons, locally scrolling tree/list/graph diagrams, and invalid graph feedback at 320/390px; the new page was also inspected at desktop width. No browser errors were logged. Reduced-motion CSS rules were inspected, but an OS-enabled reduced-motion session and dedicated screen-reader session were not exercised. Comprehensive audits remain deferred.
