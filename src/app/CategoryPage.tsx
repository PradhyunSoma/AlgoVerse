import { Link } from 'react-router'
import AlgorithmIllustration from '../components/AlgorithmIllustration'
import Icon from '../components/Icon'
import type { Category } from './categories'

export default function CategoryPage({ category }: { category: Category }) {
  return (
    <section className={`category-page category-${category.id}`} aria-labelledby="category-title">
      <Link className="secondary-link" to="/">
        <span aria-hidden="true">←</span> Back to dashboard
      </Link>
      <div className="category-page-header">
        <span className="category-icon"><Icon name={category.id} /></span>
        <span className="soon-badge"><span />Coming Soon</span>
      </div>
      <h1 id="category-title">{category.title}</h1>
      <p className="hero-description">{category.description}</p>
      <div className="category-preview">
        <AlgorithmIllustration category={category.id} />
        <div>
          <p className="eyebrow">ON THE ROADMAP</p>
          <h2>What you’ll explore</h2>
          <p className="planned-description">{category.plannedDescription}</p>
          <ul className="topic-list" aria-label="Planned topics">
            {category.topics.map((topic) => <li key={topic}>{topic}</li>)}
          </ul>
        </div>
      </div>
      <p className="placeholder-note">This visualizer is planned for a future release.</p>
    </section>
  )
}
