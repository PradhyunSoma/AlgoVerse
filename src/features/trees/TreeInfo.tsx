import ComplexityPanel from '../../components/ComplexityPanel'
import { treeComplexity } from './complexity'

export default function TreeInfo() {
  return <section className="bubble-info lesson-panel tree-info" aria-labelledby="tree-info-title">
    <div><p className="eyebrow">HIERARCHY · ONE NODE AT A TIME</p><h2 id="tree-info-title">Same tree. Four ways to explore.</h2>
      <p>A binary tree has a ROOT and at most two children per node, labeled left and right. A parent points to a child;
        a leaf has no children. A subtree contains a node and all its descendants. NULL means a missing child.</p>
      <p>This is a general binary tree: values can appear in any order, including duplicates and negatives. Inorder does not necessarily produce sorted values.
        Each stable node ID identifies a reference, even when two nodes have the same value.</p>
      <p>Depth counts edges from ROOT to a node (ROOT has depth 0). Height counts edges on the longest downward path to a leaf:
        a single-node tree has height 0; this interface uses −1 for an empty tree. Balanced trees spread nodes across branches;
        skewed trees resemble a chain and can have height n − 1.</p>
      <p>Recursion enters a node’s call, explores its children, and returns to its waiting parent. The call stack records these unfinished calls.
        Visiting means appending a value to the output; the timing of that visit determines the traversal order.</p>
      <dl className="tree-traversal-notes">
        <div><dt>Preorder · Root, Left, Right</dt><dd>Visit a parent before its descendants. Example: 1, 2, 4, 5, 3, 6.</dd></div>
        <div><dt>Inorder · Left, Root, Right</dt><dd>Visit between the two subtrees. Example: 4, 2, 5, 1, 3, 6.</dd></div>
        <div><dt>Postorder · Left, Right, Root</dt><dd>Visit after both subtrees. Example: 4, 5, 2, 6, 3, 1.</dd></div>
        <div><dt>Level-order · Breadth first</dt><dd>A first-in, first-out queue keeps shallower nodes ahead of their children. Example: 1, 2, 3, 4, 5, 6.</dd></div>
      </dl>
    </div>
    <ComplexityPanel profile={treeComplexity.binary} />
    </section>
}
