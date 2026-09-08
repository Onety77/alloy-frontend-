import { useGame } from '@/state/store'
import { useMarketClock } from '@/state/useMarketClock'
import { AppShell } from '@/components/layout/AppShell'
import { ForgeScreen } from '@/screens/ForgeScreen'
import { InventoryScreen } from '@/screens/InventoryScreen'
import { SmithyScreen } from '@/screens/SmithyScreen'
import type { ScreenId } from '@/lib/types'

const SCREENS: Partial<Record<ScreenId, () => React.ReactElement>> = {
  forge: ForgeScreen,
  inventory: InventoryScreen,
  smithy: SmithyScreen,
}

function Placeholder({ name }: { name: string }) {
  return (
    <div className="screen screen--stack">
      <div className="panel" style={{ padding: 48, textAlign: 'center' }}>
        <h2 style={{ textTransform: 'capitalize' }}>{name}</h2>
      </div>
    </div>
  )
}

export function App() {
  useMarketClock()
  const screen = useGame((s) => s.screen)
  const Screen = SCREENS[screen]

  return <AppShell>{Screen ? <Screen /> : <Placeholder name={screen} />}</AppShell>
}
