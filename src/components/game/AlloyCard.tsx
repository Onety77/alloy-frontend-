import type { Alloy, Quote } from '@/lib/types'
import { metalById } from '@/lib/metals'
import { RARITIES, lockedValue, redeemValue } from '@/lib/rarity'
import { AlloyIngot } from './AlloyIngot'
import { pct, usd } from '@/lib/format'
import './AlloyCard.css'

function Stat({ name, value, color }: { name: string; value: number; color: string }) {
  return (
    <div className="alloy__stat">
      <span className="alloy__stat-name">{name}</span>
      <span className="alloy__bar">
        <span
          className="alloy__bar-fill"
          style={{ width: `${value}%`, background: `linear-gradient(90deg, ${color}66, ${color})` }}
        />
      </span>
      <span className="alloy__stat-val">{value}</span>
    </div>
  )
}

export function AlloyCard({
  alloy,
  quotes,
  selected = false,
  onClick,
  footer,
}: {
  alloy: Alloy
  quotes: Record<string, Quote>
  selected?: boolean
  onClick?: () => void
  footer?: React.ReactNode
}) {
  const rarity = RARITIES[alloy.rarity]!
  const locked = lockedValue(alloy)
  const redeem = redeemValue(alloy, quotes)
  // How far the underlying has moved since it was escrowed. The 10% melt cut
  // is constant, so comparing against locked * 0.9 isolates the market move.
  const movePct = locked > 0 ? (redeem / (locked * 0.9) - 1) * 100 : 0
  const metals = alloy.components.map((c) => metalById(c.metalId))

  const Wrapper = onClick ? 'button' : 'div'

  return (
    <Wrapper
      className={`alloy${onClick ? ' alloy--interactive' : ''}${selected ? ' alloy--selected' : ''}`}
      style={{ ['--rarity' as string]: rarity.color }}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      <div className="alloy__head">
        <span className="alloy__rarity">{rarity.name}</span>
        <span className="alloy__serial">#{String(alloy.serial).padStart(4, '0')}</span>
      </div>

      <div className="alloy__art">
        <AlloyIngot alloy={alloy} size={92} />
      </div>

      <div className="alloy__name">{alloy.name}</div>
      <div className="alloy__blend">
        {metals.map((m) => (
          <span key={m.id} style={{ color: m.line }}>
            {m.ticker}
          </span>
        ))}
      </div>

      <div className="alloy__chips">
        {alloy.cracked && <span className="tag tag--loss">Cracked</span>}
        {alloy.coldForged && <span className="tag tag--frost">Cold-forged</span>}
        {alloy.overclock > 0 && <span className="tag tag--ember">OC {alloy.overclock}%</span>}
        {alloy.slot !== null && <span className="tag">Slotted</span>}
        {alloy.expeditionId && <span className="tag">Away</span>}
      </div>

      <div className="alloy__stats">
        <Stat name="Purity" value={alloy.purity} color={rarity.color} />
        <Stat name="Resonance" value={alloy.resonance} color="var(--arcane-300)" />
        <Stat name="Integrity" value={alloy.integrity} color="var(--frost-300)" />
      </div>

      <div className="alloy__foot">
        <span className="alloy__metric">
          <span className="alloy__metric-label">Yield</span>
          <span className="alloy__metric-value">{alloy.yieldPerDay.toFixed(1)}/day</span>
        </span>
        <span className="alloy__metric" style={{ alignItems: 'flex-end' }}>
          <span className="alloy__metric-label">Melt value</span>
          <span className="alloy__metric-value">
            {usd(redeem)}{' '}
            <span
              className="alloy__delta"
              style={{ color: movePct >= 0 ? 'var(--gain)' : 'var(--loss)' }}
            >
              {pct(movePct)}
            </span>
          </span>
        </span>
      </div>

      {footer}
    </Wrapper>
  )
}
