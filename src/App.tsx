import { useGame } from '@/state/store'
import { useMarketClock } from '@/state/useMarketClock'
import { AppShell } from '@/components/layout/AppShell'
import { ForgeScreen } from '@/screens/ForgeScreen'

function Placeholder({ name }: { name: string }) {
  return (
    <div className="screen">
      <div className="panel" style={{ padding: 40, textAlign: 'center' }}>
        <h2>{name}</h2>
      </div>
    </div>
  )
}

export function App() {
  useMarketClock()
  const screen = useGame((s) => s.screen)

  switch (screen) {
    case 'forge':
      return (
        <AppShell>
          <ForgeScreen />
        </AppShell>
      )
    default:
      return (
        <AppShell>
          <Placeholder name={screen} />
        </AppShell>
      )
  }
}
