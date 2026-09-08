import { useEffect, useState } from 'react'
import { useGame } from '@/state/store'
import { useReading } from '@/state/selectors'
import { countdown } from '@/lib/format'
import { clamp } from '@/lib/rng'
import { MetalRail } from './MetalRail'
import { Crucible } from './Crucible'
import { ArcaneMarket } from './ArcaneMarket'
import { CraftReveal, type CraftPhase } from './CraftReveal'
import './ForgeScreen.css'

/** How long the pour animation runs before the result lands. */
const POUR_MS = 1700

export function ForgeScreen() {
  const reading = useReading()
  const overclock = useGame((s) => s.overclock)
  const nextOracleAt = useGame((s) => s.nextOracleAt)
  const craft = useGame((s) => s.craft)
  const connect = useGame((s) => s.connect)
  const connected = useGame((s) => s.wallet.connected)
  const setScreen = useGame((s) => s.setScreen)
  const clearSelection = useGame((s) => s.clearSelection)

  const [phase, setPhase] = useState<CraftPhase>({ kind: 'idle' })
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  // The vessel glows off both the tape and how hard you are pushing it.
  const heat = clamp(reading.heat * 0.72 + (overclock / 100) * 0.34, 0, 1)

  const handleCraft = () => {
    if (!connected) connect()
    setPhase({ kind: 'pouring' })

    window.setTimeout(() => {
      const result = craft()
      if (!result) {
        setPhase({ kind: 'idle' })
        return
      }
      setPhase({ kind: 'result', alloy: result.alloy })
    }, POUR_MS)
  }

  return (
    <>
      <div className="screen forge">
        <MetalRail secondsToOracle={countdown(nextOracleAt - now)} />

        <Crucible heat={heat} onCraft={handleCraft} />

        <div className="forge__market">
          <ArcaneMarket reading={reading} />
        </div>
      </div>

      <CraftReveal
        phase={phase}
        onClose={() => setPhase({ kind: 'idle' })}
        onForgeAgain={() => {
          setPhase({ kind: 'idle' })
          clearSelection()
        }}
        onViewInventory={() => {
          setPhase({ kind: 'idle' })
          setScreen('inventory')
        }}
      />
    </>
  )
}
