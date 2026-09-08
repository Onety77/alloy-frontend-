/** Minimal colour maths for gauges and rarity blending. */

type RGB = [number, number, number]

function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n)

/** Blend two hex colours in sRGB. Good enough at gauge-tick size. */
export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  const k = clamp01(t)
  const r = Math.round(r1 + (r2 - r1) * k)
  const g = Math.round(g1 + (g2 - g1) * k)
  const bl = Math.round(b1 + (b2 - b1) * k)
  return `rgb(${r} ${g} ${bl})`
}

/**
 * Sample a multi-stop ramp at `t`. Stops are assumed evenly spaced, which is
 * true for every gauge in the app and keeps the call sites free of positions.
 */
export function ramp(stops: string[], t: number): string {
  if (stops.length === 0) return 'transparent'
  if (stops.length === 1) return stops[0]!
  const k = clamp01(t) * (stops.length - 1)
  const i = Math.min(Math.floor(k), stops.length - 2)
  return mix(stops[i]!, stops[i + 1]!, k - i)
}

export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgb(${r} ${g} ${b} / ${clamp01(alpha)})`
}
