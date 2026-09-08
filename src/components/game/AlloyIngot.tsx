import { useId } from 'react'
import type { Alloy } from '@/lib/types'
import { metalById } from '@/lib/metals'
import { RARITIES } from '@/lib/rarity'

/**
 * An alloy renders as its constituents fused: the body gradient is built from
 * the component metals in melt order, so a NVD/AMD bloom really is green
 * running into orange. Rarity supplies the rim light and the bloom around it.
 */
export function AlloyIngot({
  alloy,
  size = 88,
  animate = false,
  className = '',
}: {
  alloy: Alloy
  size?: number
  /** Slow molten drift across the face, used in the reveal. */
  animate?: boolean
  className?: string
}) {
  const uid = useId().replace(/:/g, '')
  const metals = alloy.components.map((c) => metalById(c.metalId))
  const rarity = RARITIES[alloy.rarity]!

  const stops = metals.map((metal, i) => ({
    color: metal.hue,
    sheen: metal.sheen,
    offset: metals.length === 1 ? 50 : (i / (metals.length - 1)) * 100,
  }))

  return (
    <svg
      className={className}
      width={size}
      height={size * (36 / 48)}
      viewBox="0 0 48 36"
      aria-hidden
      style={{ filter: `drop-shadow(0 0 ${size / 7}px ${rarity.color}88)`, overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={`ab-${uid}`} x1="0" y1="0" x2="1" y2="0.35">
          {stops.map((s, i) => (
            <stop key={i} offset={`${s.offset}%`} stopColor={s.color} />
          ))}
        </linearGradient>
        <linearGradient id={`at-${uid}`} x1="0" y1="0" x2="1" y2="0">
          {stops.map((s, i) => (
            <stop key={i} offset={`${s.offset}%`} stopColor={s.sheen} />
          ))}
        </linearGradient>
        <linearGradient id={`ash-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.3" />
          <stop offset="38%" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="72%" stopColor="#000" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.68" />
        </linearGradient>
        {/* Vertical falloff at the flanks so the face reads as curved metal. */}
        <linearGradient id={`aflank-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#000" stopOpacity="0.42" />
          <stop offset="18%" stopColor="#000" stopOpacity="0" />
          <stop offset="82%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.42" />
        </linearGradient>
        {animate && (
          <linearGradient id={`aflow-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={rarity.color} stopOpacity="0">
              <animate attributeName="offset" values="-0.4;1" dur="2.6s" repeatCount="indefinite" />
            </stop>
            <stop offset="15%" stopColor={rarity.color} stopOpacity="0.55">
              <animate attributeName="offset" values="-0.25;1.15" dur="2.6s" repeatCount="indefinite" />
            </stop>
            <stop offset="30%" stopColor={rarity.color} stopOpacity="0">
              <animate attributeName="offset" values="-0.1;1.3" dur="2.6s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
        )}
      </defs>

      <path d="M13 5h22l4 9H9Z" fill={`url(#at-${uid})`} />
      <path d="M9 14h30l3 17H6Z" fill={`url(#ab-${uid})`} />
      <path d="M9 14h30l3 17H6Z" fill={`url(#ash-${uid})`} />
      <path d="M9 14h30l3 17H6Z" fill={`url(#aflank-${uid})`} />

      {/* Rarity rim light along the struck edge */}
      <path d="M9 14h30" stroke="#000" strokeOpacity="0.5" strokeWidth="1" />
      <path d="M9.6 15h28.8" stroke={rarity.color} strokeOpacity="0.6" strokeWidth="0.9" />

      <path d="M13 15.5 17.5 30.5h3.4L16.6 15.5Z" fill="#fff" opacity="0.13" />
      <path d="M13 5h22" stroke="#fff" strokeOpacity="0.3" strokeWidth="0.9" />

      {animate && <path d="M9 14h30l3 17H6Z" fill={`url(#aflow-${uid})`} />}

      {alloy.cracked && (
        <path
          d="M22 14 19 22l4 3-2 6"
          stroke="#0a0a0c"
          strokeOpacity="0.85"
          strokeWidth="1.4"
          fill="none"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
}
