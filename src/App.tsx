import type { ReactElement } from 'react'
import { useGame } from '@/state/store'
import { useMarketClock } from '@/state/useMarketClock'
import { AppShell } from '@/components/layout/AppShell'
import { ForgeScreen } from '@/screens/ForgeScreen'
import { InventoryScreen } from '@/screens/InventoryScreen'
import { SmithyScreen } from '@/screens/SmithyScreen'
import { MarketScreen } from '@/screens/MarketScreen'
import { ContractsScreen } from '@/screens/ContractsScreen'
import { ResearchScreen } from '@/screens/ResearchScreen'
import { HallScreen } from '@/screens/HallScreen'
import type { ScreenId } from '@/lib/types'

const SCREENS: Record<ScreenId, () => ReactElement> = {
  forge: ForgeScreen,
  inventory: InventoryScreen,
  smithy: SmithyScreen,
  market: MarketScreen,
  contracts: ContractsScreen,
  research: ResearchScreen,
  hall: HallScreen,
}

export function App() {
  useMarketClock()
  const screen = useGame((s) => s.screen)
  const Screen = SCREENS[screen]

  // Keyed so each screen replays its entrance rather than cross-fading in place.
  return (
    <AppShell>
      <Screen key={screen} />
    </AppShell>
  )
}
