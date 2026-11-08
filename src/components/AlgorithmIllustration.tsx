import type { CategoryId } from '../app/categories'

// Decorative diagrams illustrate each category without simulating execution.
export default function AlgorithmIllustration({ category }: { category: CategoryId }) {
  return (
    <svg viewBox="0 0 240 90" fill="none" className="algorithm-illustration" aria-hidden="true">
      {category === 'sorting' && (
        <g fill="currentColor">
          {[26, 52, 38, 68, 45, 59, 76].map((height, index) => (
            <rect
              key={index}
              x={18 + index * 30}
              y={85 - height}
              width="18"
              height={height}
              rx="4"
              opacity={0.3 + index * 0.1}
            />
          ))}
        </g>
      )}
      {category === 'linked-lists' && (
        <g stroke="currentColor" strokeWidth="1.5">
          <path d="M56 45h32m-6-5 6 5-6 5m62-5h32m-6-5 6 5-6 5" />
          {[12, 100, 188].map((x) => (
            <g key={x}>
              <rect x={x} y="24" width="40" height="42" rx="8" fill="currentColor" fillOpacity=".08" />
              <circle cx={x + 20} cy="45" r="4" fill="currentColor" />
            </g>
          ))}
        </g>
      )}
      {category === 'trees' && (
        <g stroke="currentColor" strokeWidth="1.5">
          <path d="m120 22-53 25m53-25 53 25M67 47 37 74m30-27 29 27m77-27-29 27m29-27 30 27" opacity=".5" />
          {[[120, 16], [67, 47], [173, 47], [37, 78], [96, 78], [144, 78], [203, 78]].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="9" fill="var(--surface)" />
          ))}
        </g>
      )}
      {category === 'graphs' && (
        <g stroke="currentColor" strokeWidth="1.5">
          <path d="m32 47 58-30 54 46 62-32M32 47l112 16M90 17l9 62 107-48" opacity=".45" />
          {[[32, 47], [90, 17], [144, 63], [206, 31], [99, 79]].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="9" fill="var(--surface)" />
          ))}
        </g>
      )}
    </svg>
  )
}
