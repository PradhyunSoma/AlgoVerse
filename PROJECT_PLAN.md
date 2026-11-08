# AlgoVerse project plan

AlgoVerse will teach algorithms through interactive examples. Learners will be able to change the input, move through an execution one step at a time, and see the visualization, pseudocode, and explanation stay in sync.

## Architecture

The initial app uses React and TypeScript with Vite and Tailwind CSS. React handles screens and local UI state. Motion animates transitions between steps, and React Flow handles interactive tree and graph canvases. The app runs entirely in the browser.

### Proposed folder structure

```text
src/
  main.tsx                 React entry point
  app/                     App shell, routes, homepage, and global styles
  components/              Shared controls, pseudocode panel, and layout
  playback/                Step cursor, playback state, and timer hook
  features/
    sorting/
    linked-lists/
    trees/
    graphs/
  test/                    Shared test setup and helpers, when needed
```

Each feature owns its page, model types, input validation, trace generators, and rendering components. Keep tests beside the logic they cover. Start with a flat feature folder and split it only when the number of files warrants it. Add comparison UI when Phase 6 begins.

### How a visualizer works

1. The user submits valid input or generates an example. The feature creates an execution trace from that input.
2. A trace is an ordered list of steps. Each step contains a feature-specific snapshot, a short explanation, and an optional stable pseudocode line ID. IDs keep highlights correct when the pseudocode is reformatted.
3. Playback selects a step. The renderer, pseudocode panel, and explanation read that same step, so stepping backward restores the corresponding visual and code state.

Start with snapshots because they make backward navigation and reset straightforward. Use bounded inputs to control trace size and keep examples readable. Add event-based storage only if measurements show a need. Playback owns timing and cursor movement. A valid input or algorithm change pauses playback and returns to step zero. An invalid edit preserves the previous valid trace. Motion handles transitions, while React Flow handles interaction and layout around the feature's data model.

Keep input, trace, and playback state local to the visualizer. Use a small algorithm catalog for titles, categories, routes, and feature availability. Introduce shared playback controls through the first working sorting example, then extend them as other features use them.

## Development phases

Complete each phase through small reviewable tasks. Verify each task as it lands and fix immediate issues. Comprehensive phase-by-phase audits against the acceptance criteria are deferred until all development phases are complete, as agreed with the user.

### Phase 1 · App foundation and homepage

**Tasks**

1. Scaffold React, TypeScript, Vite, and Tailwind CSS. Add type-check, lint, build, and test commands.
2. Build a responsive app shell and homepage with sorting, linked list, tree, and graph categories.
3. Add routes and label unfinished categories as upcoming. Verify navigation and basic accessibility.

**Acceptance criteria**

- The dev server loads and type-check, lint, test, and production build commands pass.
- The homepage works at mobile and desktop widths. Navigation supports keyboard use, and links lead to implemented destinations.

### Phase 2 · Sorting and shared playback

**Tasks**

1. Build Bubble Sort end to end with an array renderer, trace, pseudocode, and next/previous controls.
2. Add play, pause, reset, speed control, custom numeric arrays, and random data.
3. Add Selection Sort with minimum tracking and algorithm switching.
4. Add Insertion Sort with a held key and accurate shift states.
5. Add Merge Sort with recursion and separate merge storage.
6. Add Quick Sort with last-element Lomuto partitioning and recursive call states.

Implementation status: Tasks 1–6 are implemented. The comprehensive Phase 2 review is deferred until all development phases are complete.

**Acceptance criteria**

- All five algorithms sort correctly and preserve the input multiset. Automated tests cover empty and single-element arrays, duplicates, negatives, and sorted and reverse-sorted inputs.
- Every step shows matching visual state and pseudocode. Previous restores the earlier step, reset pauses at the first step, and autoplay stops at the final step.
- Changing speed affects playback timing without skipping steps. Changing valid input or algorithm pauses at the new first step. Invalid input yields a clear message, and generated input meets the same rules as custom input.

### Phase 3 · Linked lists

**Tasks**

1. Build singly linked list traversal, insertion, and deletion with step traces.
2. Add doubly linked lists and show updates to both links.
3. Add circular singly linked lists, with traversal that stops after one loop.

Implementation status: Tasks 1–3 are implemented. Singly linked lists support forward traversal; doubly linked lists support forward and backward traversal with HEAD, TAIL, and reciprocal next/prev references. All three variants support insertion/deletion at the beginning, end, or a zero-based position. Snapshot traces include temporary local references and individual pointer changes, and reuse shared playback. Completed results become the next operation's input; replay does not apply an operation twice. Switching list types pauses playback and preserves the last committed values and node IDs, discarding unfinished previews. The interface supports up to 8 nodes with integer values from -99 to 99. Circular singly linked lists maintain HEAD and TAIL, show the closing next reference (or a singleton self-loop), and stop traversal upon returning to HEAD. Type conversion opens/closes the last link while preserving committed values and IDs. Circular traces show each pointer write and locally held nodes; tests independently verify the exact final cycle. The comprehensive Phase 3 audit remains deferred until all development phases are complete. Phase 4 progress is recorded below.

**Acceptance criteria**

- All three variants visualize traversal and pointer changes with the shared controls and matching pseudocode.
- Tests cover empty and single-node lists, head and tail updates, and invalid operations. Doubly linked lists retain reciprocal links, and a nonempty circular list links its tail back to its head.

### Phase 4 · Binary trees, BSTs, and AVL trees

**Tasks**

1. Render a user-editable general binary tree and visualize preorder, inorder, postorder, and level-order traversal. Use SVG for the bounded, non-draggable tree in this task; React Flow remains an option when later tasks need an interactive canvas.
2. Add BST search, insertion, and deletion. Define and surface the duplicate-key policy before implementation.
3. Add AVL insertion and deletion, with visible balance factors and rotation steps.

Implementation status: Tasks 1–3 are implemented. The general binary tree model has stable node IDs, ROOT and left/right references, with validation against cycles, multiple parents, missing references, and unreachable nodes. Queue-based level-order input accepts up to 15 numeric nodes from -99 to 99, supports explicit NULL slots, and rejects unreachable extra entries. Preorder, inorder, postorder, and level-order generate deterministic frozen snapshots, including recursive NULL calls/returns or BFS queue changes. SVG uses fixed inorder-rank columns and depth rows with keyboard-scrollable overflow. Shared playback is reused unchanged.

BST operations include insertion, search, all three deletion cases, minimum/maximum, and the four shared traversals. Duplicate insertions are rejected. General binary trees and BSTs keep separate saved states; switching cancels playback and discards unfinished previews without converting either tree. Completed mutations are checkpointed once; Reset/Replay only inspect history. Two-child deletion transplants the actual successor node, preserving its ID and right subtree. Each pointer write has a frozen snapshot; detached components are displayed as locally held subtrees until reconnected or released. Completed mutations validate strict BST ordering and reachability. Limits remain 15 nodes and integers from -99 to 99. AVL behavior is documented below; comprehensive audits remain deferred.

AVL trees maintain node heights (NULL 0, leaf 1) and balance factors h(left) − h(right). Insertion and deletion repair the affected ancestor path, including all four rotation cases, zero-balance-child deletion cases, and multiple ancestor repairs. Rotations preserve stable IDs and show each pointer write, locally held middle subtrees, parent/ROOT reconnection, and height updates. Cached heights awaiting recalculation are explicitly marked; structural balance factors derive from the same snapshot. Search, extrema, traversals, SVG layout, and playback reuse existing modules. All three tree types retain independent saved states. The four presets construct the first two values with real AVL insertion and trace insertion of the third. Completed mutations validate ordering, reachability, stored heights, and AVL balance and commit exactly once. Phase 5 progress is recorded below.

**Acceptance criteria**

- Learners can inspect nodes and edges and replay all four binary-tree traversals.
- Tests verify traversal order and the BST invariant after each completed operation, including leaf, one-child, and two-child deletion.
- AVL tests cover all four rotation cases and deletion rebalancing. Completed operations preserve BST order and leave each node's subtree heights at most one apart.

### Phase 5 · Graph algorithms

**Tasks**

1. Add graph representation, a validated vertex/edge text editor, directed/undirected mode, start selection, and BFS with queue, parents, distances, and immutable traces. Use lightweight deterministic SVG for this bounded, non-draggable graph, as requested.
2. Add DFS with its stack/recursive path and visit order, reusing graph input, layout, and playback.
3. Add Dijkstra with editable weights, distance updates, and path reconstruction to a selected reachable node.

Implementation status: Tasks 1–3 are implemented. The graph model separates stable vertex IDs/labels from stable edge IDs/endpoints, and algorithms use alphabetically sorted adjacency lists. Both directed and undirected graphs support cycles, disconnected components, and isolated vertices. The editor accepts up to 10 vertices and 20 edges; labels are unique uppercase 1–4 letter/digit identifiers starting with a letter. Lowercase is normalized. Duplicate edges and self-loops are rejected; reciprocal directed edges are allowed. Valid edits preserve retained identities and reset playback; invalid edits pause and preserve the previous graph and step. Removing the start chooses the first alphabetical remaining vertex. Restore Sample resets the start to A. State is local to the page.

BFS marks vertices discovered before enqueueing, uses a FIFO front cursor, and processes only reachable vertices. Frozen snapshots include queue, discovery/output/processed sets, active/neighbor/edge IDs, parents, distances, tree edges, explanations, and stable pseudocode IDs. SVG positions depend only on the graph; directed reciprocal edges have curved lanes. The live queue and results read the same snapshot as the diagram and pseudocode. Shared playback is unchanged. Task-level tests cover queue transitions, shortest unweighted distances, editing, identity preservation, playback, exact backward restoration, and regressions. Dijkstra is documented below. Comprehensive audits remain deferred.

Recursive DFS shares graph editing, adjacency lists, stable SVG positions, parent/adjacency results, pseudocode rendering, and playback with BFS. Switching algorithms preserves the valid graph and selected start and pauses at a fresh first step. DFS snapshots record actual call entry, discovery, visits, edge checks, recursive calls, returns, completion, and backtracking. A return snapshot retains the exiting frame; after the actual function returns, the caller records its removal/completion and then a backtrack snapshot. Finished nodes never remain on the active stack. Discovery order and completion order are labeled separately. Directed backtracking is explicitly a return of control, not a reverse edge traversal. The sample DFS discovery order is A, B, D, E, F, C; completion order is D, C, F, E, B, A. DFS exposes no shortest-path distance claim. Weighted edges remain stored when BFS/DFS ignore their costs. Task-level tests cover stack push/pop transitions, cyclic/directed/disconnected inputs, exact backward restoration, all speeds, graph edits, algorithm switching, and BFS/other-feature regressions.

**Acceptance criteria**

- Graph editing produces a valid graph or gives actionable feedback. BFS and DFS visit the reachable nodes in a documented, deterministic order.
- Dijkstra rejects negative weights, handles zero weights, and displays correct distances and paths. Unreachable nodes are identified.
- Tests cover disconnected graphs, cycles, and competing weighted paths. Playback keeps node and edge highlights synchronized with pseudocode.

Dijkstra implementation: all edges now carry integer weights from 0 to 99. The shared editor accepts `A-B: 4`, defaults omitted weights to 1, and rejects negative/malformed/non-finite values and parallel edges. Weight changes retain edge IDs. Switching BFS/DFS/Dijkstra preserves graph, source, destination, and draft text, and resets playback. Dijkstra’s Restore Sample Graph loads the five-vertex weighted sample with source A and destination E; other algorithms retain their existing sample.

A dependency-free binary min-heap uses distance, label, stable ID, and insertion sequence as deterministic priority order. Lazy duplicate entries are shown in actual heap-array order and skipped when stale. Strict relaxation preserves the first equal-cost predecessor. Frozen traces separate distance updates, predecessor updates, heap updates, extract-min, stale checks, finalization, edge inspection/calculation, and completion. UI distinguishes tentative distances from finalized answers and labels pending predecessor updates. Weighted SVG adds non-overlapping opaque labels, relaxation/predecessor highlights, and selected finalized paths. Reconstruction checks predecessor direction, cycles, finalized status, and summed route cost. The sample yields A=0, B=3, C=1, D=4, E=7 and A→C→B→D→E at cost 7. Tests cover heap invariants, exhaustive small-graph route costs, snapshot restoration, all speeds, switching/editing, and prior modules. Phase 5 implementation is complete; comprehensive audits remain deferred. Phase 6 has not started.

### Phase 6 · Comparisons and learning polish

**Tasks**

1. Add time and space complexity explanations with assumptions and case distinctions where relevant.
2. Compare sorting algorithms on the same input using defined metrics such as key comparisons and writes. Explain how each metric is counted.
3. Review the core workflows for mobile layout, keyboard access, reduced motion, and performance at the supported input limits.

**Acceptance criteria**

- Each shipped algorithm has complexity notes that match the implementation and distinguish theoretical bounds from counts observed in one run.
- Sorting comparisons use identical starting data and consistently defined metrics. Small known examples verify the counts.
- Core learning workflows can be completed on mobile and with a keyboard. Reduced-motion mode preserves every step and its meaning.

### Phase 7 · Optional learning extensions

**Tasks**

1. If approved, prototype quizzes with explanations and retry.
2. If separately approved, define the AI tutor's scope, service needs, privacy, and cost before implementation.

**Acceptance criteria**

- A shipped quiz gives feedback, explains the answer, and supports retry.
- A shipped tutor can explain the selected algorithm and step. Its availability is independent of the core visualizers.
