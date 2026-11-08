import { useLayoutEffect, useRef, useState } from 'react'
import BinaryTreePage from './BinaryTreePage'
import { EXAMPLE_TREE_INPUT, parseTreeInput } from './treeModel'
import BSTPage from './bst/BSTPage'
import { createBST } from './bst/bstModel'
import AVLPage from './avl/AVLPage'
import { createAVL } from './avl/avlOperations'

export default function TreesPage() {
  const [type, setType] = useState('binary')
  const [general, setGeneral] = useState(() => ({ tree: parseTreeInput(EXAMPLE_TREE_INPUT), input: EXAMPLE_TREE_INPUT }))
  const [bst, setBST] = useState(() => createBST())
  const [avl, setAVL] = useState(() => createAVL())
  const typeControl = useRef<HTMLSelectElement>(null)
  const previousType = useRef(type)
  useLayoutEffect(() => {
    // The lesson remounts on a type change; keep keyboard focus on its selector.
    if (previousType.current !== type) typeControl.current?.focus()
    previousType.current = type
  }, [type])
  const selector = <div className="algorithm-selector"><label htmlFor="tree-type">Tree type</label>
    <select ref={typeControl} id="tree-type" value={type} aria-describedby="tree-type-help" onChange={(event) => setType(event.target.value)}>
      <option value="binary">Binary Tree</option><option value="bst">Binary Search Tree</option><option value="avl">AVL Tree</option></select>
    <p id="tree-type-help">Each type keeps its own saved tree. Switching stops playback and discards unfinished previews. Returning starts a fresh lesson; trees are never converted or reordered.</p>
  </div>
  // Unmounting a lesson cancels its shared playback timer. Only committed data lives above it.
  return type === 'binary' ? <BinaryTreePage initialTree={general.tree} initialInput={general.input}
    onTreeChange={(tree, input) => setGeneral({ tree, input })} typeSelector={selector} />
    : type === 'bst' ? <BSTPage initialTree={bst} onSave={setBST} typeSelector={selector} />
      : <AVLPage initialTree={avl} onSave={setAVL} typeSelector={selector} />
}
