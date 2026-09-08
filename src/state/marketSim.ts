import type { Metal, Quote } from '@/lib/types'
import { gaussian, mulberry32, type Rng } from '@/lib/rng'

/**
 * Stand-in for the Chainlink feed.
 *
 * Prices follow a mean-reverting random walk anchored to each metal's opening
 * mark. Reversion keeps a long session from drifting somewhere absurd, and the
 * per-metal sigma is the same number the rarity engine normalises against, so
 * the gauge and the odds always agree about what "hot" means.
 *
 * Swapping this for a real feed means replacing `stepQuotes` and leaving every
 * consumer untouched.
 */

/** Oracle heartbeat. The forge screen counts down to the next push. */
export const ORACLE_PERIOD_MS = 180_000
/** How often prices drift between pushes. */
export const TICK_MS = 2_000

const HISTORY = 64
const REVERSION = 0.012

export function seedQuotes(metals: Metal[], seed = 0xf0a9e): Record<string, Quote> {
  const rng = mulberry32(seed)
  const quotes: Record<string, Quote> = {}

  for (const metal of metals) {
    // Open each metal somewhere plausible relative to its previous close so the
    // board is not uniformly flat on first paint.
    const drift = gaussian(rng) * metal.volatility * 0.6
    const prevClose = metal.basePrice
    const price = Math.max(0.01, prevClose * (1 + drift))

    // Backfill a believable history so sparklines have something to draw.
    const history: number[] = []
    let walk = price
    for (let i = 0; i < HISTORY; i++) {
      walk *= 1 + gaussian(rng) * metal.volatility * 0.1
      history.push(walk)
    }
    history.reverse()
    history[history.length - 1] = price

    quotes[metal.id] = {
      metalId: metal.id,
      price,
      prevClose,
      changePct: (price / prevClose - 1) * 100,
      history,
    }
  }

  return quotes
}

/**
 * Advance every quote one tick. `intensity` is scaled up on an oracle push so
 * the heartbeat lands as a visible step rather than more of the same drift.
 */
export function stepQuotes(
  quotes: Record<string, Quote>,
  metals: Metal[],
  rng: Rng,
  intensity = 1,
): Record<string, Quote> {
  const next: Record<string, Quote> = {}

  for (const metal of metals) {
    const quote = quotes[metal.id]
    if (!quote) continue

    const sigmaPerTick = metal.volatility * 0.055 * intensity
    const shock = gaussian(rng) * sigmaPerTick
    const pull = (metal.basePrice / quote.price - 1) * REVERSION
    const price = Math.max(0.01, quote.price * (1 + shock + pull))

    const history = quote.history.length >= HISTORY
      ? [...quote.history.slice(1), price]
      : [...quote.history, price]

    next[metal.id] = {
      ...quote,
      price,
      changePct: (price / quote.prevClose - 1) * 100,
      history,
    }
  }

  return { ...quotes, ...next }
}

/** Aggregate board temperature, used by the market screen and the top bar. */
export function boardTemperature(quotes: Record<string, Quote>, metals: Metal[]): number {
  if (!metals.length) return 0
  let sum = 0
  for (const metal of metals) {
    const q = quotes[metal.id]
    if (q) sum += q.changePct / (metal.volatility * 100 * 2.2)
  }
  return Math.max(-1, Math.min(1, sum / metals.length))
}
