import { Dial } from '@/components/ui/Dial'
import { Panel, SectionHeading } from '@/components/ui/Panel'
import { Button } from '@/components/ui/Button'

export function App() {
  return (
    <div style={{ padding: 40, display: 'grid', gap: 20, maxWidth: 420 }}>
      <Panel rivets style={{ padding: 16 }}>
        <SectionHeading>Market Temperature</SectionHeading>
        <Dial
          value={0.5}
          stops={['#5aaed6', '#b8934f', '#f2510b']}
          readout="NEUTRAL"
          caption="Pick metals to read the market"
          endLabels={['Cold', 'Hot']}
        />
        <Button tone="ember" block>Craft</Button>
      </Panel>
    </div>
  )
}
