import { useMemo } from 'react'
import { useGame, computePerks, computeReading, type Perks } from './store'
import type { ForgeReading } from '@/lib/rarity'

/**
 * Memoised views over the store.
 *
 * Never write `useGame((s) => s.perks())`: the method allocates a new object on
 * every call, so `useSyncExternalStore` would see a different snapshot each
 * render and loop until React bails out. Subscribing to the raw inputs and
 * deriving under `useMemo` keeps the identity stable between real changes.
 */

export function usePerks(): Perks {
  const research = useGame((s) => s.research)
  return useMemo(() => computePerks(research), [research])
}

export function useReading(): ForgeReading {
  const selection = useGame((s) => s.selection)
  const quotes = useGame((s) => s.quotes)
  const band = useGame((s) => s.band)
  const overclock = useGame((s) => s.overclock)
  const coldWindow = useGame((s) => s.coldWindow)
  const perks = usePerks()

  return useMemo(
    () => computeReading(selection, quotes, band, overclock, coldWindow, perks),
    [selection, quotes, band, overclock, coldWindow, perks],
  )
}
