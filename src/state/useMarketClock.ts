import { useEffect } from 'react'
import { useGame } from './store'
import { TICK_MS } from './marketSim'

/**
 * Drives the market forward. Mounted once at the app root.
 *
 * Pauses while the tab is hidden so a backgrounded session does not burn
 * cycles, then takes a single catch-up step on return — shard accrual is
 * computed from elapsed wall-clock time, so nothing is lost by not ticking.
 */
export function useMarketClock() {
  const tick = useGame((s) => s.tick)

  useEffect(() => {
    let id = 0

    const start = () => {
      stop()
      id = window.setInterval(tick, TICK_MS)
    }
    const stop = () => {
      if (id) window.clearInterval(id)
      id = 0
    }

    const onVisibility = () => {
      if (document.hidden) {
        stop()
      } else {
        tick()
        start()
      }
    }

    start()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [tick])
}
