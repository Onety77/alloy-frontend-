const usdFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const usd = (n: number): string => usdFmt.format(n)

/** Compact for balances that can run into six figures. */
export function compact(n: number, digits = 1): string {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(digits)}M`
  if (abs >= 1_000) return `${(n / 1_000).toFixed(digits)}K`
  return n.toFixed(abs < 10 && !Number.isInteger(n) ? digits : 0)
}

export const pct = (n: number, digits = 1): string =>
  `${n >= 0 ? '+' : ''}${n.toFixed(digits)}%`

/** Bare percentage with no sign, for risk and odds readouts. */
export const pctPlain = (n: number, digits = 0): string => `${(n * 100).toFixed(digits)}%`

export const eth = (n: number, digits = 3): string => `${n.toFixed(digits)} ETH`

/** mm:ss for the oracle heartbeat. */
export function countdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** Coarser clock for expeditions and season timers. */
export function duration(ms: number): string {
  if (ms <= 0) return 'ready'
  const mins = Math.floor(ms / 60_000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${mins % 60}m`
  return `${mins}m`
}

export function timeAgo(at: number): string {
  const secs = Math.floor((Date.now() - at) / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export const shortAddress = (address: string): string => address
