import { useId } from 'react'

/**
 * Single-series sparkline. One metal per chart by design — see the note on
 * `Metal.line` for why the board facets instead of overlaying.
 *
 * No axes, no legend: the row already carries the ticker and the price, so the
 * chart's only job is the shape of the move. The dashed rule is the previous
 * close, which is what makes "up or down on the day" readable at a glance.
 */
export function Sparkline({
  values,
  color,
  baseline,
  width = 96,
  height = 30,
  showEndDot = true,
  className = '',
}: {
  values: number[]
  color: string
  /** Reference level, drawn as a dashed rule. Usually the previous close. */
  baseline?: number
  width?: number
  height?: number
  showEndDot?: boolean
  className?: string
}) {
  const uid = useId().replace(/:/g, '')

  if (values.length < 2) {
    return <svg className={className} width={width} height={height} aria-hidden />
  }

  const pad = 2.5
  const pool = baseline === undefined ? values : [...values, baseline]
  const min = Math.min(...pool)
  const max = Math.max(...pool)
  const span = max - min || 1

  const x = (i: number) => pad + (i / (values.length - 1)) * (width - pad * 2)
  const y = (v: number) => height - pad - ((v - min) / span) * (height - pad * 2)

  const line = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(2)} ${y(v).toFixed(2)}`).join(' ')
  const area = `${line} L${x(values.length - 1).toFixed(2)} ${height} L${x(0).toFixed(2)} ${height} Z`

  const lastX = x(values.length - 1)
  const lastY = y(values[values.length - 1]!)

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={`spark-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {baseline !== undefined && (
        <line
          x1={0}
          x2={width}
          y1={y(baseline)}
          y2={y(baseline)}
          stroke="var(--ink-500)"
          strokeWidth="1"
          strokeDasharray="2 3"
          opacity="0.6"
        />
      )}

      <path d={area} fill={`url(#spark-${uid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

      {showEndDot && (
        <>
          <circle cx={lastX} cy={lastY} r="3.4" fill={color} opacity="0.28" />
          <circle cx={lastX} cy={lastY} r="1.9" fill={color} />
        </>
      )}
    </svg>
  )
}
