import type { CategoryId } from '../app/categories'

export type IconName = CategoryId | 'logo' | 'dashboard' | 'arrow' | 'code' | 'steps' | 'eye' | 'menu' | 'close'

const paths: Record<IconName, string> = {
  logo: 'm4 17 8-13 8 13M7 12h10M4 21h16',
  dashboard: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  sorting: 'M5 20V11M12 20V4M19 20V8',
  'linked-lists': 'M8 12h8m-3-3 3 3-3 3M2 8h6v8H2zM16 8h6v8h-6z',
  trees: 'M9 3h6v5H9zM3 16h6v5H3zM15 16h6v5h-6zM12 8v4M6 16v-4h12v4',
  graphs: 'M6 6 18 5M6 6l5 13M18 5l-7 14M18 5l3 10M11 19l10-4M3 3h6v6H3zM16 3h4v4h-4zM9 17h4v4H9zM19 13h4v4h-4z',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  code: 'm8 6-6 6 6 6m8-12 6 6-6 6M14 3l-4 18',
  steps: 'M4 5h5v5H4zM15 14h5v5h-5zM9 7h8v7M4 18h5',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12m13 0a3 3 0 1 0-6 0 3 3 0 0 0 6 0',
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'm6 6 12 12M6 18 18 6',
}

export default function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  )
}
