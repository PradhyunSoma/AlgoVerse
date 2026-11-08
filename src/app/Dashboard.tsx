import AlgorithmIllustration from '../components/AlgorithmIllustration'
import CategoryCard from '../components/CategoryCard'
import Icon, { type IconName } from '../components/Icon'
import { categories } from './categories'

const learningSteps: { icon: IconName; title: string; description: string }[] = [
  {
    icon: 'eye',
    title: 'See the idea',
    description: 'Turn abstract concepts into clear, visual stories you can follow.',
  },
  {
    icon: 'steps',
    title: 'Take it step by step',
    description: 'Move at your own pace and understand what changes at each step.',
  },
  {
    icon: 'code',
    title: 'Connect it to code',
    description: 'Follow highlighted code to see how each instruction shapes the result.',
  },
]

function HeroIllustration() {
  return (
    <div className="hero-art" aria-hidden="true">
      <div className="art-orbit orbit-one" />
      <div className="art-orbit orbit-two" />
      <div className="art-code">
        <div className="art-window-dots"><i /><i /><i /></div>
        <div><span>function</span> understand(idea) {'{'}</div>
        <div className="code-indent">explore(idea)</div>
        <div className="code-indent"><span>return</span> clarity</div>
        <div>{'}'}</div>
      </div>
      <div className="art-chart">
        <div className="art-chart-label">
          <span className="status-dot" /> IDEAS, IN ORDER <Icon name="sorting" />
        </div>
        <AlgorithmIllustration category="sorting" />
        <div className="art-axis"><span>observe</span><span>understand</span></div>
      </div>
      <div className="art-caption"><span>01</span> A different way to see it.</div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-line" />WELCOME TO ALGOVERSE</p>
          <h1 id="hero-title">
            Explore Algorithms <span>Visually</span><span className="hero-period">.</span>
          </h1>
          <p className="hero-description">
            A little less abstract. A lot more intuitive. Discover data structures
            and algorithms through visual, step-by-step learning.
          </p>
          <div className="hero-actions">
            <a className="primary-link" href="#categories">
              Explore the categories <Icon name="arrow" />
            </a>
            <a className="secondary-link" href="#how-it-works">
              How it works <span aria-hidden="true">↗</span>
            </a>
          </div>
          <p className="hero-footnote">
            <span className="small-spark" aria-hidden="true">✧</span>
            Made for the moment it finally clicks.
          </p>
        </div>
        <HeroIllustration />
      </section>

      <section id="categories" aria-labelledby="categories-title" className="categories-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">YOUR LEARNING PATH</p>
            <h2 id="categories-title">Small steps. Big discoveries.</h2>
          </div>
          <span className="section-meta">04 categories to explore</span>
        </div>
        <div className="category-grid">
          {categories.map((category) => <CategoryCard key={category.id} category={category} />)}
        </div>
      </section>

      <section id="how-it-works" aria-labelledby="how-title" className="how-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">UNDERSTANDING, BY DESIGN</p>
            <h2 id="how-title">How AlgoVerse Works</h2>
          </div>
          <span className="section-meta">The experience we’re building</span>
        </div>
        <ol className="learning-grid">
          {learningSteps.map((step, index) => (
            <li key={step.title}>
              <div className="step-top"><Icon name={step.icon} /><span>0{index + 1}</span></div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="coming-next" aria-labelledby="coming-next-title">
        <span className="next-icon"><Icon name="sorting" /></span>
        <div className="next-copy">
          <p className="eyebrow">READY TO EXPLORE</p>
          <h2 id="coming-next-title">Meet Bubble Sort.</h2>
          <p>
            Our first visualizer. Watch neighboring values trade places,
            and follow the logic behind every swap.
          </p>
        </div>
        <span className="next-status"><span className="status-dot" /> Bubble Sort is ready</span>
      </section>
    </>
  )
}
