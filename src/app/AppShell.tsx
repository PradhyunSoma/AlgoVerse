import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { matchPath, NavLink, useLocation } from 'react-router'
import Icon from '../components/Icon'
import { categories } from './categories'

function Brand() {
  return (
    <span className="brand">
      <span className="brand-symbol"><Icon name="logo" /></span>
      <span>
        Algo<span className="brand-accent">Verse</span>
        <span className="brand-caption">A space to understand.</span>
      </span>
    </span>
  )
}

export default function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [openLocationKey, setOpenLocationKey] = useState<string | null>(null)
  const menuOpen = openLocationKey === location.key
  const menuButton = useRef<HTMLButtonElement>(null)
  const mainContent = useRef<HTMLElement>(null)
  const category = categories.find((item) => matchPath(item.path, location.pathname))
  const pageTitle = category?.title ?? (matchPath('/code-visualizer', location.pathname) ? 'Code Visualizer' : location.pathname === '/' ? 'Dashboard' : 'Page not found')

  // Clear the previous entry so returning with Back/Forward keeps the menu closed.
  if (openLocationKey !== null && openLocationKey !== location.key) {
    setOpenLocationKey(null)
  }

  useEffect(() => {
    document.title = `${pageTitle} | AlgoVerse`
    if (location.hash) {
      document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'instant' })
      return
    }
    mainContent.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname, location.hash, pageTitle])

  function handleNavigation(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    setOpenLocationKey(null)
    mainContent.current?.focus({ preventScroll: true })
  }

  function navigationClass({ isActive }: { isActive: boolean }) {
    return `nav-item${isActive ? ' is-active' : ''}`
  }

  return (
    <div
      className="app-shell"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && menuOpen) {
          setOpenLocationKey(null)
          menuButton.current?.focus()
        }
      }}
    >
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="mobile-header">
        <Brand />
        <button
          ref={menuButton}
          className="menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="site-navigation"
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          onClick={() => setOpenLocationKey(menuOpen ? null : location.key)}
        >
          <Icon name={menuOpen ? 'close' : 'menu'} />
        </button>
      </header>
      <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`}>
        <div className="sidebar-brand"><Brand /></div>
        <nav id="site-navigation" aria-label="Main navigation">
          <p className="nav-label">WORKSPACE</p>
          <NavLink
            className={navigationClass}
            to="/"
            end
            onClick={handleNavigation}
          >
            <Icon name="dashboard" />
            Dashboard
            <span className="active-dot" />
          </NavLink>
          <p className="nav-label topics-label">EXPLORE</p>
          {categories.map((category) => (
            <NavLink
              className={navigationClass}
              to={category.path}
              end
              key={category.id}
              aria-label={category.status === 'coming-soon' ? `${category.navigationLabel} — Coming soon` : category.navigationLabel}
              onClick={handleNavigation}
            >
              <Icon name={category.id} />
              <span>{category.navigationLabel}</span>
              {category.status === 'coming-soon' && <span className="nav-soon">Soon</span>}
            </NavLink>
          ))}
          <NavLink className={navigationClass} to="/code-visualizer" end onClick={handleNavigation} aria-label="Code Visualizer" aria-describedby="code-nav-soon">
            <Icon name="code" />
            <span>Code Visualizer</span>
            <span id="code-nav-soon" className="nav-soon">Coming Soon</span>
          </NavLink>
        </nav>
        <div className="sidebar-note">
          <span className="note-icon"><Icon name="code" /></span>
          <p>Big ideas. Small steps.</p>
          <span>Build your understanding,<br />one algorithm at a time.</span>
        </div>
        <div className="sidebar-footer">
          <span className="status-dot" />
          A learning space in the making
          <span className="version">v0.1</span>
        </div>
      </aside>
      <div className="workspace">
        <header className="workspace-header">
          <span className="flex items-center gap-3">
            <Icon name="dashboard" />
            <span>Workspace</span>
            <span className="header-divider">/</span>
            <strong>{pageTitle}</strong>
          </span>
          <span className="workspace-tag">LEARN BY EXPLORING</span>
        </header>
        <main ref={mainContent} id="main-content" tabIndex={-1} className="dashboard">{children}</main>
        <footer className="page-footer">
          <span>AlgoVerse <span className="footer-dot">·</span> Make the abstract make sense.</span>
          <span>Built for curious minds.</span>
        </footer>
      </div>
    </div>
  )
}
