import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App'

const routeCases = [
  { path: '/', title: 'Explore Algorithms Visually.', navigation: 'Dashboard' },
  { path: '/sorting', title: 'Bubble Sort', navigation: 'Sorting' },
  { path: '/linked-lists', title: 'Singly Linked List', navigation: 'Linked Lists' },
  { path: '/trees', title: 'Binary Tree', navigation: 'Trees' },
  { path: '/graphs', title: 'Breadth-First Search', navigation: 'Graphs' },
  { path: '/code-visualizer', title: 'Custom Code Visualizer', navigation: 'Code Visualizer' },
]

beforeEach(() => {
  // jsdom has no layout or scrolling. Browser checks cover the actual scroll behavior.
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  Element.prototype.scrollIntoView = vi.fn()
})

afterEach(() => vi.restoreAllMocks())

function renderPage(path = '/') {
  window.history.replaceState(null, '', path)
  return render(<BrowserRouter><App /></BrowserRouter>)
}

test.each(routeCases)('renders $path directly and marks its navigation active', ({ path, title, navigation }) => {
  renderPage(path)
  expect(screen.getByRole('heading', { name: title, level: 1 })).toBeVisible()
  const nav = within(screen.getByRole('navigation', { name: 'Main navigation' }))
  expect(nav.getByRole('link', { name: navigation })).toHaveAttribute('aria-current', 'page')
  expect(document.title).toContain('AlgoVerse')
  if (path === '/graphs') {
    expect(screen.getByRole('link', { name: 'Back to dashboard' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('button', { name: 'Apply Graph' })).toBeVisible()
  }
})

test('preserves homepage sections, topic lists, and section links', () => {
  renderPage()
  const expectedTopics = {
    'Sorting Algorithms': ['Bubble', 'Selection', 'Insertion', 'Merge', 'Quick'],
    'Linked Lists': ['Singly', 'Doubly', 'Circular'],
    Trees: ['Binary Trees', 'BST', 'AVL'],
    Graphs: ['BFS', 'DFS', 'Dijkstra'],
  }
  for (const [name, topics] of Object.entries(expectedTopics)) {
    const card = within(screen.getByRole('article', { name }))
    expect(card.getByText(name === 'Sorting Algorithms' ? 'Bubble Sort live' : name === 'Linked Lists' ? 'Singly linked list live' : name === 'Trees' ? 'Binary tree live' : 'BFS live')).toBeVisible()
    for (const topic of topics) expect(card.getByText(topic)).toBeVisible()
  }
  expect(screen.getByRole('heading', { name: 'How AlgoVerse Works' })).toBeVisible()
  expect(screen.getByRole('heading', { name: 'Meet Bubble Sort.' })).toBeVisible()
  for (const name of ['Explore the categories', 'How it works', 'Skip to content']) {
    const href = screen.getByRole('link', { name }).getAttribute('href')!
    expect(document.getElementById(href.slice(1))).toBeInTheDocument()
  }
})

test('navigates through every sidebar link and updates active styles and focus', async () => {
  renderPage()
  const nav = within(screen.getByRole('navigation', { name: 'Main navigation' }))
  for (const route of [...routeCases.slice(1), routeCases[0]]) {
    fireEvent.click(nav.getByRole('link', { name: route.navigation }))
    expect(await screen.findByRole('heading', { name: route.title, level: 1 })).toBeVisible()
    expect(window.location.pathname).toBe(route.path)
    expect(nav.getByRole('link', { name: route.navigation })).toHaveClass('is-active')
    expect(screen.getByRole('main')).toHaveFocus()
    expect(document.querySelectorAll('nav [aria-current="page"]')).toHaveLength(1)
  }
})

test.each(routeCases.slice(1, 5))('opens $path from its category card and returns home', async ({ path, title }) => {
  renderPage()
  const cardTitle = path === '/sorting' ? 'Sorting Algorithms' : path === '/linked-lists' ? 'Linked Lists' : path === '/trees' ? 'Trees' : 'Graphs'
  const card = within(screen.getByRole('article', { name: cardTitle }))
  fireEvent.click(card.getByRole('link', { name: cardTitle }))
  expect(await screen.findByRole('heading', { name: title, level: 1 })).toBeVisible()
  expect(window.location.pathname).toBe(path)
  fireEvent.click(screen.getByRole('link', { name: 'Back to dashboard' }))
  expect(await screen.findByRole('heading', { name: routeCases[0].title })).toBeVisible()
})

test('shows a 404 for unknown paths and provides a working return link', async () => {
  renderPage('/missing/nested-page')
  expect(screen.getByText('404 · PAGE NOT FOUND')).toBeVisible()
  expect(screen.getByRole('heading', { name: 'This path ends here.' })).toBeVisible()
  expect(document.querySelector('nav [aria-current="page"]')).toBeNull()
  fireEvent.click(screen.getByRole('link', { name: 'Back to dashboard' }))
  expect(await screen.findByRole('heading', { name: routeCases[0].title })).toBeVisible()
})

test('responds to browser Back and Forward and closes an open menu on history navigation', async () => {
  renderPage()
  const nav = within(screen.getByRole('navigation', { name: 'Main navigation' }))
  fireEvent.click(nav.getByRole('link', { name: 'Sorting' }))
  await screen.findByRole('heading', { name: 'Bubble Sort', level: 1 })
  fireEvent.click(nav.getByRole('link', { name: 'Graphs' }))
  await screen.findByRole('heading', { name: 'Breadth-First Search', level: 1 })
  fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }))

  await act(async () => window.history.back())
  await waitFor(() => expect(window.location.pathname).toBe('/sorting'))
  expect(await screen.findByRole('heading', { name: 'Bubble Sort', level: 1 })).toBeVisible()
  expect(nav.getByRole('link', { name: 'Sorting' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('button', { name: 'Open navigation' })).toHaveAttribute('aria-expanded', 'false')

  await act(async () => window.history.forward())
  expect(await screen.findByRole('heading', { name: 'Breadth-First Search', level: 1 })).toBeVisible()
  expect(window.location.pathname).toBe('/graphs')
  expect(nav.getByRole('link', { name: 'Graphs' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('button', { name: 'Open navigation' })).toHaveAttribute('aria-expanded', 'false')
})

test('closes mobile navigation with Escape or a link and manages focus', async () => {
  renderPage()
  const toggle = screen.getByRole('button', { name: 'Open navigation' })
  fireEvent.click(toggle)
  expect(toggle).toHaveAttribute('aria-expanded', 'true')
  const dashboardLink = screen.getByRole('link', { name: 'Dashboard' })
  dashboardLink.focus()
  fireEvent.keyDown(dashboardLink, { key: 'Escape' })
  expect(toggle).toHaveAttribute('aria-expanded', 'false')
  expect(toggle).toHaveFocus()

  fireEvent.click(toggle)
  fireEvent.click(dashboardLink)
  expect(toggle).toHaveAttribute('aria-expanded', 'false')
  expect(screen.getByRole('main')).toHaveFocus()
  fireEvent.click(toggle)
  fireEvent.click(within(screen.getByRole('navigation', { name: 'Main navigation' })).getByRole('link', { name: 'Trees' }))
  await screen.findByRole('heading', { name: 'Binary Tree', level: 1 })
  expect(toggle).toHaveAttribute('aria-expanded', 'false')
  expect(screen.getByRole('main')).toHaveFocus()
})

test('restores a dashboard section when opening a hash URL', () => {
  renderPage('/#categories')
  expect(screen.getByRole('heading', { name: routeCases[0].title })).toBeVisible()
  expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'instant' })
  expect(window.location.hash).toBe('#categories')
})


test('Code Visualizer is an honest static preview, reachable from mobile navigation and dashboard', async () => {
  renderPage()
  const card = within(screen.getByRole('region', { name: 'Code Visualizer' }))
  expect(card.getByText('Coming Soon')).toBeVisible()
  fireEvent.click(card.getByRole('link', { name: 'Code Visualizer' }))
  expect(await screen.findByRole('heading', { name: 'Custom Code Visualizer' })).toBeVisible()
  const main = within(screen.getByRole('main'))
  expect(main.getByText('Coming Soon')).toBeVisible()
  expect(main.getByText('Visualize how your own code executes, step by step.')).toBeVisible()
  expect(main.getByText('Illustrative preview · Not interactive')).toBeVisible()
  expect(main.getByText(/programming language.*still being planned/)).toBeVisible()
  expect(main.getByRole('figure')).toHaveTextContent('No code is running.')
  expect(main.queryByRole('textbox')).not.toBeInTheDocument()
  expect(main.queryByRole('button')).not.toBeInTheDocument()
  fireEvent.click(main.getByRole('link', { name: 'Back to Dashboard' }))
  expect(await screen.findByRole('heading', { name: routeCases[0].title })).toBeVisible()
  const toggle = screen.getByRole('button', { name: 'Open navigation' })
  fireEvent.click(toggle)
  const nav = within(screen.getByRole('navigation', { name: 'Main navigation' }))
  const link = nav.getByRole('link', { name: 'Code Visualizer' })
  expect(link).toHaveAccessibleDescription('Coming Soon')
  link.focus()
  expect(link).toHaveFocus()
  fireEvent.click(link)
  expect(toggle).toHaveAttribute('aria-expanded', 'false')
  expect(link).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('main')).toHaveFocus()
  await act(async () => window.history.back())
  expect(await screen.findByRole('heading', { name: routeCases[0].title })).toBeVisible()
  await act(async () => window.history.forward())
  expect(await screen.findByRole('heading', { name: 'Custom Code Visualizer' })).toBeVisible()
})
