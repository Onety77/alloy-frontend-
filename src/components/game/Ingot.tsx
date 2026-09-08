import { useId } from 'react'
import type { Metal } from '@/lib/types'

/** Angular marks struck into the ingot face. One per metal, picked by id. */
const RUNES = [
  'M9 6v12M4 9l5-3 5 3M4 15l5 3 5-3',
  'M4 6h10M9 6v12M4 18h10',
  'M4 18 9 6l5 12M6 14h6',
  'M4 6h10l-10 12h10',
  'M9 5v14M4 9l10 6M14 9 4 15',
  'M5 6v12M13 6v12M5 12h8',
  'M9 5 14 12 9 19 4 12Z',
  'M4 7h10M4 12h7M4 17h10',
  'M6 6 12 12 6 18M13 6v12',
  'M4 12a5 5 0 0 1 10 0 5 5 0 0 1-10 0M9 3v18',
  'M4 8l5-3 5 3v8l-5 3-5-3Z',
]

const runeFor = (id: string): string => {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return RUNES[hash % RUNES.length]!
}

export function Ingot({
  metal,
  size = 44,
  glow = false,
  className = '',
}: {
  metal: Metal
  size?: number
  /** Lit from within — used when the metal is loaded in the crucible. */
  glow?: boolean
  className?: string
}) {
  const uid = useId().replace(/:/g, '')

  return (
    <svg
      className={className}
      width={size}
      height={size * (36 / 48)}
      viewBox="0 0 48 36"
      aria-hidden
      style={glow ? { filter: `drop-shadow(0 0 10px ${metal.hue})` } : undefined}
    >
      <defs>
        <linearGradient id={`face-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={metal.hue} />
          <stop offset="58%" stopColor={metal.hue} stopOpacity="0.82" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id={`top-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={metal.sheen} />
          <stop offset="55%" stopColor={metal.hue} />
          <stop offset="100%" stopColor={metal.sheen} stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {/* Cast body: top face catches the key light, front face falls away. */}
      <path d="M13 5h22l4 9H9Z" fill={`url(#top-${uid})`} />
      <path d="M9 14h30l3 17H6Z" fill={`url(#face-${uid})`} />

      {/* Struck edge where the two faces meet */}
      <path d="M9 14h30" stroke="#000" strokeOpacity="0.45" strokeWidth="1" />
      <path d="M9.6 15h28.8" stroke={metal.sheen} strokeOpacity="0.3" strokeWidth="0.8" />

      {/* Rune, pressed in: dark cut with a light lower lip */}
      <g transform="translate(15 12.5) scale(0.78)">
        <path d={runeFor(metal.id)} stroke="#000" strokeOpacity="0.55" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={runeFor(metal.id)} stroke={metal.sheen} strokeOpacity="0.72" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Specular sweep across the front face */}
      <path d="M12 16 18 31h5L16.5 16Z" fill={metal.sheen} opacity="0.14" />
    </svg>
  )
}
