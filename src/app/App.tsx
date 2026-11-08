import { Route, Routes } from 'react-router'
import AppShell from './AppShell'
import CodeVisualizerPage from './CodeVisualizerPage'
import GraphsPage from '../features/graphs/GraphsPage'
import Dashboard from './Dashboard'
import NotFoundPage from './NotFoundPage'
import SortingPage from '../features/sorting/SortingPage'
import LinkedListPage from '../features/linked-lists/LinkedListPage'
import TreesPage from '../features/trees/TreesPage'
import { categories } from './categories'

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/code-visualizer" element={<CodeVisualizerPage />} />
        {categories.map((category) => (
          <Route key={category.id} path={category.path} element={
            category.id === 'sorting' ? <SortingPage /> : category.id === 'linked-lists' ? <LinkedListPage /> : category.id === 'trees' ? <TreesPage /> : <GraphsPage />
          } />
        ))}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  )
}
