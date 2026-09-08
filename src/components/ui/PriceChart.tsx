import { useId, useMemo, useRef, useState } from 'react'
import { pct, usd } from '@/lib/format'
import './PriceChart.css'

const PAD = { top: 12, right: 46, bottom: 18, left: 8 }

/**
 * Single-series price chart with a crosshair.
 *
 * One metal at a time by design — see `Metal.line`. Because there is only ever
 * one series, the title names it and no legend is needed; the dashed rule is
 * the previous close, which is the reference the day's move is quoted against.
 */
export function PriceChart({
  values,
  color,
  baseline,
  height = 190,
  label,
}: {
  values: number[]
  color: string
  baseline: number
  height?: number
  label: string
}) {
  const uid = useId().replace(/:/g, '')
  const ref = useRef<SVGSVGElement>(null)
  const [hover, setHover] = useState<number | null>(null)

  // Fixed viewBox width; the SVG scales to its container and the crosshair
  // converts pointer position back through the same coordinate space.
  const W = 620
  const H = height

  const geom = useMemo(() => {
    if (values.length < 2) return null
    const pool = [...values, baseline]
    const min = Math.min(...pool)
    const max = Math.max(...pool)
    const span = max - min || 1
    // Breathing room so the line never rides the frame.
    const lo = min - span * 0.12
    const hi = max + span * 0.12
    const range = hi - lo

    const x = (i: number) => PAD.left + (i / (values.length - 1)) * (W - PAD.left - PAD.right)
    const y = (v: number) => PAD.top + (1 - (v - lo) / range) * (H - PAD.top - PAD.bottom)

    const line = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(2)} ${y(v).toFixed(2)}`).join(' ')
    const area = `${line} L${x(values.length - 1).toFixed(2)} ${H - PAD.bottom} L${x(0).toFixed(2)} ${H - PAD.bottom} Z`

    return { x, y, line, area, lo, hi, min, max }
  }, [values, baseline, H])

  if (!geom) return <div style={{ height }} />

  const last = values[values.length - 1]!
  const active = hover ?? values.length - 1
  const activeValue = values[active]!
  const move = (activeValue / baseline - 1) * 100

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = ref.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    const plot = (ratio * W - PAD.left) / (W - PAD.left - PAD.right)
    const index = Math.round(plot * (values.length - 1))
    setHover(Math.max(0, Math.min(values.length - 1, index)))
  }

  // Three ticks is enough context without turning the panel into a grid.
  const ticks = [geom.hi, (geom.hi + geom.lo) / 2, geom.lo]

  return (
    <div className="pchart">
      <svg
        ref={ref}
        className="pchart__svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${label} price, ${usd(last)}, ${pct((last / baseline - 1) * 100)} against previous close`}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`pc-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.26" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((value, i) => (
          <g key={i}>
            <line
              className="pchart__grid"
              x1={PAD.left}
              x2={W - PAD.right}
              y1={geom.y(value)}
              y2={geom.y(value)}
            />
            <text className="pchart__axis" x={W - PAD.right + 6} y={geom.y(value) + 3}>
              {value.toFixed(2)}
            </text>
          </g>
        ))}

        {/* Previous close: the reference the day's move is measured from. */}
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={geom.y(baseline)}
          y2={geom.y(baseline)}
          stroke="var(--ink-500)"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.8"
        />
        <text className="pchart__axis" x={PAD.left + 3} y={geom.y(baseline) - 5}>
          prev close
        </text>

        <path d={geom.area} fill={`url(#pc-${uid})`} />
        <path d={geom.line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {hover !== null && (
          <line
            className="pchart__crosshair"
            x1={geom.x(hover)}
            x2={geom.x(hover)}
            y1={PAD.top}
            y2={H - PAD.bottom}
          />
        )}

        <circle cx={geom.x(active)} cy={geom.y(activeValue)} r="4.5" fill={color} opacity="0.3" />
        <circle cx={geom.x(active)} cy={geom.y(activeValue)} r="2.6" fill={color} />

        <rect className="pchart__hit" x="0" y="0" width={W} height={H} />
      </svg>

      {hover !== null && (
        <div
          className="pchart__tip"
          style={{
            left: `${((geom.x(hover) / W) * 100).toFixed(2)}%`,
            top: `${((geom.y(activeValue) / H) * 100).toFixed(2)}%`,
          }}
        >
          <div className="pchart__tip-price">{usd(activeValue)}</div>
          <div
            className="pchart__tip-move"
            style={{ color: move >= 0 ? 'var(--gain)' : 'var(--loss)' }}
          >
            {pct(move)} vs close
          </div>
        </div>
      )}
    </div>
  )
}
