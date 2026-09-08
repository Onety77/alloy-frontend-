import { useGame } from '@/state/store'
import { metalById } from '@/lib/metals'
import { INVESTMENT_BANDS, type InvestmentBand } from '@/lib/rarity'
import { Panel } from '@/components/ui/Panel'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Ingot } from '@/components/game/Ingot'
import { usd } from '@/lib/format'
import './Crucible.css'

const SLOT_COUNT = 3

function Slot({
  metalId,
  optional,
  onRemove,
}: {
  metalId?: string
  optional: boolean
  onRemove: () => void
}) {
  if (!metalId) {
    return (
      <div className={`slot${optional ? ' slot--optional' : ''}`}>
        <span className="slot__label">{optional ? 'Optional' : 'Empty'}</span>
      </div>
    )
  }

  const metal = metalById(metalId)
  return (
    <div
      className="slot slot--filled"
      style={{ ['--slot-hue' as string]: metal.hue, ['--slot-line' as string]: metal.line }}
      onClick={onRemove}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onRemove()}
      title={`Remove ${metal.name}`}
    >
      <span className="slot__remove">
        <Icon name="close" size={11} />
      </span>
      <Ingot metal={metal} size={50} glow />
      <span className="slot__ticker">{metal.ticker}</span>
      <span className="slot__name">{metal.name}</span>
    </div>
  )
}

export function Crucible({ heat, onCraft }: { heat: number; onCraft: () => void }) {
  const selection = useGame((s) => s.selection)
  const toggleMetal = useGame((s) => s.toggleMetal)
  const band = useGame((s) => s.band)
  const setBand = useGame((s) => s.setBand)
  const connected = useGame((s) => s.wallet.connected)

  const ready = selection.length >= 2
  const perMetal = selection.length ? band / selection.length : 0

  return (
    <Panel rivets className="craft">
      <div className="banner">
        <span className="banner__text">CRAFT</span>
      </div>

      <div className="crucible" style={{ ['--heat' as string]: heat.toFixed(3) }}>
        <div className="crucible__ring">
          <div className="crucible__melt">
            <div className="crucible__crust" />
            <div className="crucible__sheen" />
            <div className="crucible__flicker" />
          </div>
        </div>

        <div className="slots">
          {Array.from({ length: SLOT_COUNT }, (_, i) => (
            <div key={i} style={{ display: 'contents' }}>
              {i > 0 && <span className="slot__join">◆</span>}
              <Slot
                metalId={selection[i]}
                optional={i === SLOT_COUNT - 1}
                onRemove={() => selection[i] && toggleMetal(selection[i]!)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="craft__bands">
        <div className="heading heading--sm" style={{ marginBottom: 7 }}>
          <span className="heading__rule" />
          <span className="heading__lozenge" />
          <span className="heading__text">Select Investment Band</span>
          <span className="heading__lozenge" />
          <span className="heading__rule" />
        </div>
        <div className="segment" role="radiogroup" aria-label="Investment band">
          {INVESTMENT_BANDS.map((value) => (
            <button
              key={value}
              className="segment__opt"
              role="radio"
              aria-checked={band === value}
              onClick={() => setBand(value as InvestmentBand)}
            >
              ${value}
            </button>
          ))}
        </div>
      </div>

      {ready && (
        <div className="craft__escrow">
          <Icon name="lock" size={12} />
          escrowing <strong>{usd(perMetal)}</strong> of each &middot; {selection.length} metals
        </div>
      )}

      <div className="craft__action">
        <Button tone="ember" size="lg" block disabled={!ready} onClick={onCraft}>
          {connected ? 'Craft' : 'Connect & Craft'}
        </Button>
      </div>

      <p className={`craft__status${ready ? ' craft__status--ready' : ''}`}>
        {ready
          ? `Ready to pour — ${selection.length} metals in the melt`
          : 'Select 2 or 3 metals to forge'}
      </p>
    </Panel>
  )
}
