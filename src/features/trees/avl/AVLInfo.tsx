import ComplexityPanel from '../../../components/ComplexityPanel'
import { treeComplexity } from '../complexity'

export default function AVLInfo() {
  return <section className="lesson-panel algorithm-info tree-info" aria-labelledby="avl-info-title">
    <div><p className="eyebrow">ORDERED · BALANCED · LOGARITHMIC</p><h2 id="avl-info-title">Small rotations. Lasting balance.</h2>
      <p>An AVL tree is a self-balancing BST. Every left-subtree value is smaller and every right-subtree value is greater. Duplicate insertions are rejected. An ordinary BST can become a chain after sorted insertions; an AVL tree repairs imbalances.</p>
      <p>Here NULL has height 0 and a leaf has height 1: h(node) = 1 + max(h(left), h(right)). This node-count convention is one greater than the edge-height convention in the general Binary Tree lesson.</p>
      <p>BF = h(left) − h(right). Values −1, 0, and +1 are balanced. Above +1 means left-heavy; below −1 means right-heavy. An asterisk beside a stored height marks a pending repair; the diagram also reports actual heights from current links.</p>
      <dl className="tree-traversal-notes"><div><dt>LL → right rotation</dt><dd>The left child leans outward (or is balanced after deletion). Promote it and move its right subtree to the old root’s left.</dd></div>
        <div><dt>RR → left rotation</dt><dd>The right child leans outward (or is balanced after deletion). Promote it and move its left subtree to the old root’s right.</dd></div>
        <div><dt>LR → left, then right</dt><dd>The left child leans inward. Rotate that child left first, then the unbalanced ancestor right. A single right rotation does not fix this inward-heavy configuration.</dd></div>
        <div><dt>RL → right, then left</dt><dd>The right child leans inward. Rotate that child right first, then the ancestor left. Each rotation is shown separately.</dd></div></dl>
      <p>Insertion follows BST comparisons, connects a leaf, and updates heights on the return path. The first unbalanced ancestor selects a rotation using its child’s balance factor. This implementation continues checking the remaining ancestors.</p>
      <p>Deletion uses the BST lesson’s strategy: disconnect a leaf, promote a sole child, or transplant the actual inorder successor for two children. Its right subtree is preserved. Repair the successor’s former ancestors, the successor at its new position, and then higher ancestors. Deletion can need rotations at multiple levels; a heavy child with BF 0 uses a single rotation.</p>
      <p>Rotations reconnect existing nodes, preserving IDs and the order of values. The middle subtree stays between the two rotated nodes, so inorder traversal remains ascending. Detached components stay visibly held by local references until reconnected.</p>
    </div><ComplexityPanel profile={treeComplexity.avl} />
    </section>
}
