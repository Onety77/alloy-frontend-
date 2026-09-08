import { useId } from 'react'
import { ramp } from '@/lib/color'
import './Dial.css'

const CX = 100
const CY = 96
const R_OUT = 80
const R_IN = 64
const TICKS = 25

/** Standard orientation: 180° points left, 90° up, 0° right. */
const angleFor = (t: number) => 180 - 180 * t
const toRad = (deg: number) => (deg * Math.PI) / 180
const px = (deg: number, r: number) => CX + r * Math.cos(toRad(deg))
const py = (deg: number, r: number) => CY - r * Math.sin(toRad(deg))

export type DialProps = {
  /** Normalised reading, 0 → 1, left → right across the arc. */
  value: number
  /** Colour ramp sampled across the arc; also tints the needle glow. */
  stops: string[]
  /** Large word under the needle, e.g. NEUTRAL or INFERNO. */
  readout?: string
  readoutColor?: string
  caption?: string
  endLabels?: [string, string]
  endColors?: [string, string]
}

export function Dial({
  value,
  stops,
  readout,
  readoutColor,
  caption,
  endLabels,
  endColors,
}: DialProps) {
  const uid = useId().replace(/:/g, '')
  const v = Math.max(0, Math.min(1, value))
  const needleAngle = angleFor(v)
  const tipColor = ramp(stops, v)

  return (
    <div className="dial">
      {readout && (
        <div className="dial__readout">
          <div className="dial__value" style={{ color: readoutColor ?? tipColor, textShadow: `0 0 22px ${tipColor}` }}>
            {readout}
          </div>
        </div>
      )}
      <svg className="dial__svg" viewBox="0 0 200 118" role="img" aria-label={readout ?? 'gauge'}>
        <defs>
          <radialGradient id={`hub-${uid}`} cx="34%" cy="30%">
            <stop offset="0%" stopColor="var(--brass-100)" />
            <stop offset="45%" stopColor="var(--brass-400)" />
            <stop offset="100%" stopColor="var(--brass-800)" />
          </radialGradient>
          <linearGradient id={`needle-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--brass-600)" />
            <stop offset="60%" stopColor={tipColor} />
            <stop offset="100%" stopColor="var(--core)" />
          </linearGradient>
          <filter id={`bloom-${uid}`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Recessed channel the ticks sit in */}
        <path
          d={`M ${px(180, R_OUT + 5)} ${py(180, R_OUT + 5)}
              A ${R_OUT + 5} ${R_OUT + 5} 0 0 1 ${px(0, R_OUT + 5)} ${py(0, R_OUT + 5)}
              L ${px(0, R_IN - 5)} ${py(0, R_IN - 5)}
              A ${R_IN - 5} ${R_IN - 5} 0 0 0 ${px(180, R_IN - 5)} ${py(180, R_IN - 5)} Z`}
          fill="rgb(0 0 0 / 0.55)"
          stroke="rgb(212 178 113 / 0.16)"
          strokeWidth="1"
        />

        {/* Graduated ticks. Passed ticks burn, the rest stay cold. */}
        {Array.from({ length: TICKS }, (_, i) => {
          const t = i / (TICKS - 1)
          const a = angleFor(t)
          const passed = t <= v + 0.001
          const major = i % 6 === 0
          const rIn = major ? R_IN - 3 : R_IN
          return (
            <line
              key={i}
              className="dial__tick"
              x1={px(a, rIn)}
              y1={py(a, rIn)}
              x2={px(a, R_OUT)}
              y2={py(a, R_OUT)}
              stroke={ramp(stops, t)}
              strokeWidth={major ? 4 : 2.6}
              strokeLinecap="butt"
              opacity={passed ? 1 : 0.22}
              filter={passed && t > 0.55 ? `url(#bloom-${uid})` : undefined}
            />
          )
        })}

        {/* Needle. Rotation is animated; geometry is drawn pointing left. */}
        <g
          className="dial__needle"
          style={{ rotate: `${180 - needleAngle}deg`, transformOrigin: `${CX}px ${CY}px` }}
        >
          <polygon
            points={`${CX},${CY - 4.5} ${CX - R_OUT + 4},${CY - 1.1} ${CX - R_OUT + 4},${CY + 1.1} ${CX},${CY + 4.5}`}
            fill={`url(#needle-${uid})`}
            filter={`url(#bloom-${uid})`}
          />
          <circle cx={CX - R_OUT + 5} cy={CY} r="2.4" fill="var(--core)" filter={`url(#bloom-${uid})`} />
          <polygon
            points={`${CX},${CY - 3.4} ${CX + 15},${CY} ${CX},${CY + 3.4}`}
            fill="var(--brass-700)"
          />
        </g>

        {/* Hub cap */}
        <circle cx={CX} cy={CY} r="9" fill={`url(#hub-${uid})`} stroke="rgb(0 0 0 / 0.75)" strokeWidth="1.5" />
        <circle cx={CX} cy={CY} r="3.2" fill="rgb(0 0 0 / 0.55)" />
      </svg>

      {endLabels && (
        <div className="dial__ends">
          <span style={{ color: endColors?.[0] ?? 'var(--frost-300)' }}>{endLabels[0]}</span>
          <span style={{ color: endColors?.[1] ?? 'var(--ember-300)' }}>{endLabels[1]}</span>
        </div>
      )}

      {caption && <div className="dial__caption">{caption}</div>}

    </div>
  )
}
