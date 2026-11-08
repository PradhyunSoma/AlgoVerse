import { Link } from 'react-router'

export default function NotFoundPage() {
  return (
    <section className="category-page" aria-labelledby="not-found-title">
      <p className="eyebrow">404 · PAGE NOT FOUND</p>
      <h1 id="not-found-title">This path ends here.</h1>
      <p className="hero-description">We couldn’t find that page. Head back to the dashboard to explore the planned categories.</p>
      <Link className="primary-link mt-7" to="/">Back to dashboard</Link>
    </section>
  )
}
