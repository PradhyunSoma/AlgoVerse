import ComplexityPanel from '../../../components/ComplexityPanel'
import { treeComplexity } from '../complexity'

export default function BSTInfo() {
  return <section className="bubble-info lesson-panel tree-info" aria-labelledby="bst-info-title"><div>
    <p className="eyebrow">ORDERED BRANCHES · PRECISE POINTERS</p><h2 id="bst-info-title">Each comparison chooses a direction.</h2>
    <p>A binary search tree is a binary tree with an ordering rule: every value in a node’s left subtree is smaller, and every value in its right subtree is greater.
      This applies to entire subtrees, not just immediate children. General binary trees have no such ordering rule. This BST rejects duplicate keys.</p>
    <p>Search compares the requested value with the current node and skips the entire opposite subtree. Insertion follows the same path to a NULL child slot,
      allocates a new node, and connects it. Minimum follows left links; maximum follows right links.</p>
    <p><strong>Deleting a leaf:</strong> replace its incoming reference with NULL.
      <strong> One child:</strong> reconnect the parent (or ROOT) directly to that child, preserving its whole subtree.</p>
    <p><strong>Two children:</strong> find the inorder successor, the smallest node in the right subtree. This visualizer transplants that actual node,
      retaining its ID and value. If it has a right child, that subtree replaces it at its old position.
      Then attach the target’s left and remaining right subtrees to the successor. If the successor is the immediate right child,
      keep its own right subtree. Only the deleted target loses its ID.</p>
    <p>Each pointer write is a separate snapshot. Detached components are shown as locally held subtrees; the tree is only labeled complete after all links are restored and validated.
      Reset and Replay revisit snapshots and do not apply a saved mutation twice.</p>
    <p>Inorder visits left subtree, node, right subtree, so unique BST values appear in ascending order.
      The other three traversals retain their usual meanings. An ordinary BST does not automatically rebalance itself: sorted insertions can create a long chain.</p>
  </div><ComplexityPanel profile={treeComplexity.bst} />
    </section>
}
