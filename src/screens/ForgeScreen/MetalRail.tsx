import { useGame } from '@/state/store'
import { activeMetals } from '@/lib/metals'
import { Panel, SectionHeading } from '@/components/ui/Panel'
import { Sparkline } from '@/components/ui/Sparkline'
import { Ingot } from '@/components/game/Ingot'
import { Icon } from '@/components/ui/Icon'
import { pct, usd } from '@/lib/format'
import './MetalRail.css'

const MAX_PICKS = 3

export function MetalRail({ secondsToOracle }: { secondsToOracle: string }) {
  const coldWindow = useGame((s) => s.coldWindow)
  const quotes = useGame((s) => s.quotes)
  const selection = useGame((s) => s.selection)
  const toggleMetal = useGame((s) => s.toggleMetal)

  const metals = activeMetals(coldWindow)
  const full = selection.length >= MAX_PICKS

  return (
    <Panel rivets className="rail">
      <SectionHeading>{coldWindow ? 'Cold Forge Stock' : 'Select Metal Stock'}</SectionHeading>

      <ul className="rail__list">
        {metals.map((metal) => {
          const quote = quotes[metal.id]
          if (!quote) return null

          const picked = selection.includes(metal.id)
          const order = selection.indexOf(metal.id) + 1
          const up = quote.changePct >= 0

          return (
            <li key={metal.id}>
              <button
                className={`metal${picked ? ' metal--picked' : ''}${!picked && full ? ' metal--full' : ''}`}
                style={{
                  ['--metal-hue' as string]: metal.hue,
                  ['--metal-line' as string]: metal.line,
                  width: '100%',
                }}
                onClick={() => toggleMetal(metal.id)}
                disabled={!picked && full}
                aria-pressed={picked}
                title={metal.trait}
              >
                {picked && <span className="metal__order">{order}</span>}

                <span className="metal__ingot">
                  <Ingot metal={metal} size={42} glow={picked} />
                </span>

                <span className="metal__body">
                  <span className="metal__name">{metal.name}</span>
                  <span className="metal__meta">
                    <span className="metal__ticker">{metal.ticker}</span>
                    <span className="metal__price">{usd(quote.price)}</span>
                  </span>
                </span>

                <span className="metal__right">
                  <span className={`metal__change metal__change--${up ? 'up' : 'down'}`}>
                    {pct(quote.changePct)}
                  </span>
                  <Sparkline
                    values={quote.history}
                    color={metal.line}
                    baseline={quote.prevClose}
                    width={62}
                    height={20}
                  />
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="rail__footer">
        <span className="rail__hint">
          {selection.length}/{MAX_PICKS} loaded
        </span>
        <span className="rail__clock">
          <Icon name="bolt" size={13} />
          {secondsToOracle}
        </span>
      </div>
    </Panel>
  )
}
