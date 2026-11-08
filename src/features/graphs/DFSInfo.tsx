import ComplexityPanel from '../../components/ComplexityPanel'
import { graphComplexity } from './complexity'

export default function DFSInfo() {
  return <section className="bubble-info lesson-panel graph-info" aria-labelledby="dfs-info-title"><div><p className="eyebrow">UNDERSTAND THE ALGORITHM</p><h2 id="dfs-info-title">Go deeper. Then backtrack.</h2>
    <p><strong>Depth-first search</strong> discovers a vertex, visits it, then recursively explores each undiscovered outgoing neighbor. Every call must finish its branch before its caller can continue. Neighbors use the same alphabetical uppercase label order as BFS, independent of edge input order.</p>
    <p>The <strong>call stack</strong> holds live recursive calls. A new call is pushed on entry. It marks discovery immediately, before inspecting any edges. Its caller waits below it. On the return instruction, the exiting frame is still shown; the next snapshot removes that frame and records its completion. Backtracking then resumes the caller’s neighbor loop.</p>
    <p>The discovered set prevents repeated visits and infinite recursion through cycles. A discovered vertex may still be active on the stack; it is <strong>fully processed</strong> only after its call returns. Discovery order and completion order are different records.</p>
    <p>Directed graphs follow outgoing arrowheads only. Returning to a caller transfers control through the call stack, even when no reverse edge exists. The cyan return highlight does not create or traverse a reverse graph edge. Disconnected or unreachable vertices are reported separately; DFS never silently starts another component.</p>
    <p>BFS explores distance levels with a queue. DFS explores a branch deeply with recursion. Changing neighbor order can change their traversal trees and output. DFS’s parent tree <strong>does not generally give shortest paths</strong>: a deep route may reach a vertex before a shorter route is examined. The DFS panel therefore does not display BFS distance values.</p>
    <p>For the restored undirected sample starting at A:<br />BFS: A → B → C → D → E → F<br />DFS: A → B → D → E → F → C<br />D finishes before B resumes and explores E. These example orders apply to the sample; your current graph’s results appear above.</p></div>
    <ComplexityPanel profile={graphComplexity.dfs} />
    </section>
}
