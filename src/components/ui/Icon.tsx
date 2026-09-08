/** Hand-drawn 24px glyph set. Geometric so they hold up at nav size. */

export type IconName =
  | 'anvil'
  | 'chest'
  | 'hammer'
  | 'scales'
  | 'scroll'
  | 'rune'
  | 'crown'
  | 'shard'
  | 'flame'
  | 'eth'
  | 'ingot'
  | 'lock'
  | 'bolt'
  | 'skull'
  | 'check'
  | 'close'
  | 'chevron'

const PATHS: Record<IconName, string> = {
  anvil: 'M3 8h5l1.3-2.3h5.4L16 8h5v2.7l-2.9 2h-2.3l1.1 6.6H7.1l1.1-6.6H5.9L3 10.7V8Z',
  chest: 'M4 9.6 6 4.5h12l2 5.1V19.5H4V9.6Zm0 2.6h16M10.4 10.6h3.2v3.4h-3.2z',
  hammer: 'M8.5 3.6h9v4.8h-9zM12 8.4v4.2M9.6 12.6h4.8L13 20.4h-2z',
  scales: 'M12 3.4v16.2M8 20.4h8M4.6 8.2h14.8M4.6 8.2 2 13.4h5.2zM19.4 8.2l-2.6 5.2H22z',
  scroll: 'M6.5 3.6h11v16.8h-11zM6.5 3.6a2 2 0 0 0 0 4h3M9 9.4h6M9 12.6h6M9 15.8h4',
  rune: 'M12 2.4 20 7v10l-8 4.6L4 17V7ZM12 7.2v9.6M8.2 9.4l7.6 5.2M15.8 9.4l-7.6 5.2',
  crown: 'M3.6 18.6h16.8L21.6 6.4l-5.4 4.2L12 3.4l-4.2 7.2L2.4 6.4ZM3.6 21.4h16.8',
  shard: 'M12 2.2 17.4 9 12 21.8 6.6 9Z',
  flame: 'M12 2.4c3.2 4.2 6 6.2 6 10.2a6 6 0 1 1-12 0c0-2.2 1-3.4 2.2-4.4 0 2 .9 3 1.8 3 1 0 1.2-1 1.2-3 0-2.2.2-4 .8-5.8Z',
  eth: 'M12 2.2 5.2 12.6 12 16.6l6.8-4ZM12 18.2l-6.8-4L12 21.8l6.8-7.6Z',
  ingot: 'M6.2 9.2h11.6l2.4 6.6H3.8Z',
  lock: 'M7 11h10v8.6H7zM9.2 11V7.8a2.8 2.8 0 0 1 5.6 0V11',
  bolt: 'M13.6 2.4 6.4 13.2h4.6l-1.4 8.4 7.6-11.2h-4.8Z',
  skull: 'M12 2.6c4.4 0 7.4 3 7.4 7 0 2.6-1.2 4-2.4 5v3.6H7v-3.6c-1.2-1-2.4-2.4-2.4-5 0-4 3-7 7.4-7ZM9.4 11.4h.02M14.6 11.4h.02',
  check: 'M4.6 12.8 9.6 18l9.8-12',
  close: 'M5.4 5.4 18.6 18.6M18.6 5.4 5.4 18.6',
  chevron: 'M8.4 4.8 15.6 12l-7.2 7.2',
}

/** Icons that read better filled than stroked. */
const FILLED = new Set<IconName>(['shard', 'ingot', 'eth', 'bolt', 'anvil'])

export function Icon({
  name,
  size = 20,
  className = '',
}: {
  name: IconName
  size?: number
  className?: string
}) {
  const filled = FILLED.has(name)
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      focusable="false"
    >
      <path
        d={PATHS[name]}
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={filled ? 0.9 : 1.7}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
