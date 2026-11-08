import { Link } from 'react-router'
import type { Category } from '../app/categories'
import AlgorithmIllustration from './AlgorithmIllustration'
import Icon from './Icon'

export default function CategoryCard({ category }: { category: Category }) {
  return (
    <article className={`category-card category-${category.id}`} aria-labelledby={`${category.id}-title`}>
      <div className="flex items-center justify-between gap-3">
        <span className="category-icon"><Icon name={category.id} /></span>
        <span className="soon-badge"><span />{category.status === 'available' ? category.id === 'graphs' ? 'BFS live' : category.id === 'trees' ? 'Binary tree live' : category.id === 'linked-lists' ? 'Singly linked list live' : 'Bubble Sort live' : 'Coming Soon'}</span>
      </div>
      <h3 id={`${category.id}-title`}>
        <Link className="category-card-link" to={category.path}>{category.title}</Link>
      </h3>
      <p className="category-description">{category.description}</p>
      <AlgorithmIllustration category={category.id} />
      <ul className="topic-list" aria-label={`${category.title} topics`}>
        {category.topics.map((topic) => <li key={topic}>{topic}</li>)}
      </ul>
    </article>
  )
}
