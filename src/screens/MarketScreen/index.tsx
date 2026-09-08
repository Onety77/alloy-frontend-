import { useState } from 'react'
import { useGame } from '@/state/store'
import { activeMetals, ALL_METALS, CRYPTO_METALS, EQUITY_METALS } from '@/lib/metals'
import { boardTemperature } from '@/state/marketSim'
import { temperatureLabel } from '@/lib/rarity'
import { Panel, SectionHeading } from '@/components/ui/Panel'
import { Sparkline } from '@/components/ui/Sparkline'
import { PriceChart } from '@/components/ui/PriceChart'
import { Ingot } from '@/components/game/Ingot'
import { Icon } from '@/components/ui/Icon'
import { ScreenHeader, Figure } from '@/components/layout/ScreenHeader'
import { compact, pct, usd } from '@/lib/format'
import './MarketScreen.css'

/**
 * Where the 3% swap fee goes. No emissions: every shard paid out is fee
 * revenue that already came through the door.
 */
const FEE_SPLIT = [
  { label: 'Back to players', share: 0.58, color: 'var(--ember-300)' },
  { label: 'Season purse', share: 0.19, color: 'var(--arcane-300)' },
  { label: 'Treasury', share: 0.14, color: 'var(--brass-400)' },
  { label: 'Liquidity', share: 0.09, color: 'var(--frost-300)' },
]

export function MarketScreen() {
  const quotes = useGame((s) => s.quotes)
  const coldWindow = useGame((s) => s.coldWindow)
  const metals = activeMetals(coldWindow)
  const [focusId, setFocusId] = useState(metals[0]!.id)

  const focus = ALL_METALS.find((m) => m.id === focusId) ?? metals[0]!
  const focusQuote = quotes[focus.id]
  const temperature = boardTemperature(quotes, metals)

  const advancing = metals.filter((m) => (quotes[m.id]?.changePct ?? 0) > 0).length

  return (
    <div className="screen market">
      <ScreenHeader
        title="Market"
        subtitle="Live marks for every metal the forge accepts. Rarity is rolled against this tape, so a green board is a better board."
      >
        <Figure label="Board" value={temperatureLabel(temperature)} tone="brass" />
        <Figure
          label="Advancing"
          value={`${advancing}/${metals.length}`}
          tone={advancing * 2 >= metals.length ? 'gain' : 'loss'}
        />
        <Figure label="Window" value={coldWindow ? 'Cold forge' : 'Equity feeds'} />
      </ScreenHeader>

      <div className="market__cols">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Panel rivets className="market__section">
            <SectionHeading>{coldWindow ? 'Crypto Metals' : 'Equity Metals'}</SectionHeading>

            <div className="board">
              {metals.map((metal) => {
                const quote = quotes[metal.id]
                if (!quote) return null
                const up = quote.changePct >= 0
                return (
                  <button
                    key={metal.id}
                    className={`board__row${focusId === metal.id ? ' board__row--on' : ''}`}
                    style={{ ['--row-line' as string]: metal.line }}
                    onClick={() => setFocusId(metal.id)}
                  >
                    <Ingot metal={metal} size={34} />
                    <span>
                      <span className="board__name">{metal.name}</span>
                      <br />
                      <span className="board__ticker">
                        {metal.ticker} &middot; {metal.underlying}
                      </span>
                    </span>
                    <span className="board__price">{usd(quote.price)}</span>
                    <span className="board__spark">
                      <Sparkline
                        values={quote.history}
                        color={metal.line}
                        baseline={quote.prevClose}
                        width={100}
                        height={26}
                      />
                    </span>
                    <span
                      className="board__change"
                      style={{ color: up ? 'var(--gain)' : 'var(--loss)' }}
                    >
                      {pct(quote.changePct)}
                    </span>
                  </button>
                )
              })}
            </div>
          </Panel>

          {focusQuote && (
            <Panel rivets className="market__section">
              <div className="detailchart__head" style={{ ['--focus-line' as string]: focus.line }}>
                <div className="detailchart__id">
                  <Ingot metal={focus} size={46} />
                  <span>
                    <span className="detailchart__title">{focus.name}</span>
                    <br />
                    <span className="detailchart__under">
                      {focus.ticker} &middot; escrows {focus.underlying}
                    </span>
                  </span>
                </div>
                <div className="detailchart__price">
                  <span className="detailchart__big">{usd(focusQuote.price)}</span>
                  <span
                    className="detailchart__move"
                    style={{ color: focusQuote.changePct >= 0 ? 'var(--gain)' : 'var(--loss)' }}
                  >
                    {pct(focusQuote.changePct)} today
                  </span>
                </div>
              </div>

              <PriceChart
                values={focusQuote.history}
                color={focus.line}
                baseline={focusQuote.prevClose}
                label={focus.name}
              />

              <p className="detailchart__trait">{focus.trait}</p>
            </Panel>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Panel rivets className="market__section">
            <SectionHeading>$ALLOY</SectionHeading>

            <div className="stat-rows">
              <div className="stat-row">
                <span className="stat-row__label">Swap fee</span>
                <span className="stat-row__value stat-row__value--brass">3.0%</span>
              </div>
              <div className="stat-row">
                <span className="stat-row__label">Emissions</span>
                <span className="stat-row__value stat-row__value--gain">None</span>
              </div>
              <div className="stat-row">
                <span className="stat-row__label">Fees to players</span>
                <span className="stat-row__value stat-row__value--gain">58%</span>
              </div>
              <div className="stat-row">
                <span className="stat-row__label">Chain</span>
                <span className="stat-row__value">Robinhood</span>
              </div>
            </div>

            <div className="fee">
              <div className="heading heading--sm">
                <span className="heading__text">Fee split</span>
                <span className="heading__lozenge" />
                <span className="heading__rule" />
              </div>

              <div
                className="fee__bar"
                role="img"
                aria-label={FEE_SPLIT.map((f) => `${f.label} ${Math.round(f.share * 100)}%`).join(', ')}
              >
                {FEE_SPLIT.map((slice) => (
                  <span
                    key={slice.label}
                    className="fee__seg"
                    style={{ flexGrow: slice.share, background: slice.color, opacity: 0.85 }}
                  />
                ))}
              </div>

              <ul className="fee__legend">
                {FEE_SPLIT.map((slice) => (
                  <li key={slice.label} className="fee__row">
                    <span className="fee__swatch" style={{ background: slice.color }} />
                    <span className="fee__label">{slice.label}</span>
                    <span className="fee__value">{Math.round(slice.share * 100)}%</span>
                  </li>
                ))}
              </ul>

              <p className="detailchart__trait">
                Rewards are funded entirely by trading fees. Nothing is minted to pay them, so the
                shard pool is only ever as large as the volume that produced it.
              </p>
            </div>
          </Panel>

          <Panel rivets className="market__section">
            <SectionHeading>Forge Window</SectionHeading>
            <div className="coldnote">
              <Icon name="flame" size={17} className="coldnote__icon" />
              <div>
                <div className="coldnote__title">
                  {coldWindow ? 'Cold forge is open' : 'Equity feeds are live'}
                </div>
                <p className="coldnote__body">
                  {coldWindow
                    ? 'Equity markets are closed for the weekend, so the crucible runs on crypto metals instead. Rarity ceilings sit lower and daily yields run richer until the feeds reopen.'
                    : 'Equity marks are streaming and the full metal roster is available. When the feeds close for the weekend the cold forge opens automatically on crypto metals.'}
                </p>
              </div>
            </div>

            <div className="stat-rows">
              {(coldWindow ? EQUITY_METALS : CRYPTO_METALS).slice(0, 5).map((metal) => (
                <div key={metal.id} className="stat-row">
                  <span className="stat-row__label" style={{ color: metal.line }}>
                    {metal.name}
                  </span>
                  <span className="stat-row__value">
                    {coldWindow ? 'reopens Monday' : `${compact(metal.basePrice)} · standby`}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
