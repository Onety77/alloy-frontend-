import { useGame } from '@/state/store'
import { usePerks } from '@/state/selectors'
import { Panel, SectionHeading } from '@/components/ui/Panel'
import { Dial } from '@/components/ui/Dial'
import { Icon } from '@/components/ui/Icon'
import { RARITIES, RARITY_ORDER, type ForgeReading } from '@/lib/rarity'
import { pctPlain } from '@/lib/format'
import './ArcaneMarket.css'

const TEMP_STOPS = ['#5aaed6', '#8fa3b8', '#b8934f', '#f2510b', '#c2340a']
const OC_STOPS = ['#4fd39a', '#5aaed6', '#b8934f', '#f2510b', '#a3220a']

/** Colour the temperature word by which end of the arc it sits on. */
function temperatureColor(temperature: number): string {
  if (temperature <= -0.3) return 'var(--frost-100)'
  if (temperature < 0.14) return 'var(--brass-200)'
  if (temperature < 0.62) return 'var(--ember-200)'
  return 'var(--ember-300)'
}

export function ArcaneMarket({ reading }: { reading: ForgeReading }) {
  const overclock = useGame((s) => s.overclock)
  const setOverclock = useGame((s) => s.setOverclock)
  const selection = useGame((s) => s.selection)
  const perks = usePerks()

  const hasSelection = selection.length > 0
  const riskPct = Math.round(reading.crackRisk * 100)
  const safe = riskPct < 12

  return (
    <Panel rivets className="arcane">
      <SectionHeading>Arcane Market</SectionHeading>

      <div className="arcane__block">
        <div className="heading heading--sm">
          <span className="heading__text">Market Temperature</span>
        </div>
        <div className="arcane__dial">
        <Dial
          value={reading.heat}
          stops={TEMP_STOPS}
          readout={hasSelection ? reading.label : 'NEUTRAL'}
          readoutColor={hasSelection ? temperatureColor(reading.temperature) : 'var(--ink-400)'}
          endLabels={['Cold', 'Hot']}
        />
        </div>
        <p className="arcane__note">
          {hasSelection ? (
            <>
              The melt reads <strong>{reading.label}</strong>.{' '}
              {reading.temperature < -0.15
                ? 'Cold-forged: worse tiers, richer yield.'
                : reading.temperature > 0.15
                  ? 'Running hot: the rare tiers open up.'
                  : 'Flat tape. Odds sit at baseline.'}
            </>
          ) : (
            'Pick metals to read the market'
          )}
        </p>
      </div>

      <span className="heading__rule" style={{ height: 1, opacity: 0.5 }} />

      <div className="arcane__block">
        <div className="heading heading--sm">
          <span className="heading__text">Overclock</span>
        </div>
        <div className="arcane__dial">
        <Dial
          value={overclock / 100}
          stops={OC_STOPS}
          readout={overclock === 0 ? 'SAFE' : overclock > 60 ? 'INFERNO' : 'PUSHED'}
          endLabels={['Safe', 'Inferno']}
          endColors={['var(--gain)', 'var(--loss)']}
        />
        </div>

        <div className="lever">
          <input
            className="lever__track"
            type="range"
            min={0}
            max={100}
            step={1}
            value={overclock}
            onChange={(e) => setOverclock(Number(e.target.value))}
            aria-label="Overclock"
          />
          <div className="lever__scale">
            <span className="lever__value">{overclock}%</span>
            <span className="lever__cap">cap {perks.maxOverclock}%</span>
          </div>
        </div>

        <p className="arcane__note">Increases potential output</p>

        <div className={`risk${safe ? ' risk--safe' : ''}`}>
          <span className="risk__top">
            <Icon name={safe ? 'check' : 'skull'} size={12} />
            {safe ? 'Within tolerance' : 'Higher temperature, higher risk'}
          </span>
          <span className="risk__value">CRACK RISK: {riskPct}%</span>
          <span className="risk__foot">{safe ? 'the vessel holds' : 'proceed with caution'}</span>
        </div>
      </div>

      <span className="heading__rule" style={{ height: 1, opacity: 0.5 }} />

      <div className="odds">
        <div className="heading heading--sm">
          <span className="heading__text">Projected Odds</span>
        </div>

        <div
          className="odds__bar"
          role="img"
          aria-label={RARITY_ORDER.map((id) => `${RARITIES[id]!.name} ${pctPlain(reading.odds[id]!, 1)}`).join(', ')}
        >
          {RARITY_ORDER.map((id) => (
            <span
              key={id}
              className="odds__seg"
              style={{
                flexGrow: reading.odds[id]!,
                background: RARITIES[id]!.color,
                opacity: 0.86,
              }}
            />
          ))}
        </div>

        <ul className="odds__legend">
          {RARITY_ORDER.map((id) => (
            <li key={id} className="odds__row">
              <span className="odds__swatch" style={{ background: RARITIES[id]!.color }} />
              <span className="odds__name">{RARITIES[id]!.name}</span>
              <span className="odds__pct">{pctPlain(reading.odds[id]!, 1)}</span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  )
}
