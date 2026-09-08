import { useState } from 'react'
import type { Alloy, Quote } from '@/lib/types'
import { metalById } from '@/lib/metals'
import { RARITIES, lockedValue, redeemValue } from '@/lib/rarity'
import { usePerks } from '@/state/selectors'
import { useGame } from '@/state/store'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { AlloyIngot } from '@/components/game/AlloyIngot'
import { Ingot } from '@/components/game/Ingot'
import { pct, usd } from '@/lib/format'

export function AlloyDetail({
  alloy,
  quotes,
  onClose,
}: {
  alloy: Alloy | null
  quotes: Record<string, Quote>
  onClose: () => void
}) {
  const melt = useGame((s) => s.melt)
  const slotAlloy = useGame((s) => s.slotAlloy)
  const unslotAlloy = useGame((s) => s.unslotAlloy)
  const perks = usePerks()
  const [confirming, setConfirming] = useState(false)

  if (!alloy) return null

  const rarity = RARITIES[alloy.rarity]!
  const locked = lockedValue(alloy)
  const redeem = (redeemValue(alloy, quotes) / 0.9) * perks.meltReturn
  const delta = redeem - locked
  const busy = alloy.expeditionId !== null

  return (
    <Modal open onClose={onClose} maxWidth={520}>
      <div className="detail" style={{ ['--rarity' as string]: rarity.color }}>
        <div className="detail__head">
          <span className="detail__tier">{rarity.name}</span>
          <AlloyIngot alloy={alloy} size={150} />
          <h2 className="detail__name">{alloy.name}</h2>
          <span className="detail__serial">
            #{String(alloy.serial).padStart(4, '0')} &middot; forged{' '}
            {new Date(alloy.forgedAt).toLocaleDateString()}
          </span>
          <div className="alloy__chips" style={{ justifyContent: 'center' }}>
            {alloy.cracked && <span className="tag tag--loss">Cracked</span>}
            {alloy.coldForged && <span className="tag tag--frost">Cold-forged</span>}
            {alloy.overclock > 0 && <span className="tag tag--ember">OC {alloy.overclock}%</span>}
            {alloy.slot !== null && <span className="tag">Slot {alloy.slot + 1}</span>}
            {busy && <span className="tag">On expedition</span>}
          </div>
        </div>

        <div className="reveal__grid">
          <div className="reveal__cell">
            <span className="reveal__cell-label">Purity</span>
            <span className="reveal__cell-value">{alloy.purity}</span>
          </div>
          <div className="reveal__cell">
            <span className="reveal__cell-label">Daily yield</span>
            <span className="reveal__cell-value">{alloy.yieldPerDay.toFixed(1)}</span>
          </div>
          <div className="reveal__cell">
            <span className="reveal__cell-label">Resonance</span>
            <span className="reveal__cell-value">{alloy.resonance}</span>
          </div>
          <div className="reveal__cell">
            <span className="reveal__cell-label">Integrity</span>
            <span className="reveal__cell-value">{alloy.integrity}</span>
          </div>
        </div>

        <div>
          <div className="heading heading--sm" style={{ marginBottom: 8 }}>
            <span className="heading__text">Stock held in escrow</span>
            <span className="heading__lozenge" />
            <span className="heading__rule" />
          </div>
          <div className="detail__components">
            {alloy.components.map((component) => {
              const metal = metalById(component.metalId)
              const price = quotes[component.metalId]?.price ?? component.lockedAt
              const move = (price / component.lockedAt - 1) * 100
              return (
                <div
                  key={component.metalId}
                  className="detail__component"
                  style={{ ['--comp-line' as string]: metal.line }}
                >
                  <Ingot metal={metal} size={32} />
                  <span>
                    <span className="detail__cname">{metal.name}</span>
                    <br />
                    <span className="detail__cshare">
                      {metal.ticker} &middot; {(component.weight * 100).toFixed(0)}% of melt
                    </span>
                  </span>
                  <span className="detail__clocked">{usd(component.lockedUsd)}</span>
                  <span
                    className="detail__cdelta"
                    style={{ color: move >= 0 ? 'var(--gain)' : 'var(--loss)' }}
                  >
                    {pct(move)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="detail__melt">
          <div className="detail__melt-row">
            <span className="detail__melt-label">Melt returns</span>
            <span className="detail__melt-value">{usd(redeem)}</span>
          </div>
          <div className="detail__melt-row">
            <span className="detail__melt-label">Originally escrowed</span>
            <span className="detail__melt-label" style={{ fontFamily: 'var(--font-mono)' }}>
              {usd(locked)}{' '}
              <span style={{ color: delta >= 0 ? 'var(--gain)' : 'var(--loss)' }}>
                ({delta >= 0 ? '+' : ''}
                {usd(delta).replace('$', '$')})
              </span>
            </span>
          </div>
          <p className="detail__melt-note">
            Melting burns the NFT and returns the underlying stock at{' '}
            {(perks.meltReturn * 100).toFixed(1)}% of its live mark. The protocol keeps the rest.
          </p>
        </div>

        <div className="detail__actions">
          {alloy.slot === null ? (
            <Button block disabled={busy} onClick={() => slotAlloy(alloy.id) && onClose()}>
              <Icon name="hammer" size={14} />
              Slot in smithy
            </Button>
          ) : (
            <Button
              block
              onClick={() => {
                unslotAlloy(alloy.id)
                onClose()
              }}
            >
              <Icon name="close" size={14} />
              Remove from slot
            </Button>
          )}

          {confirming ? (
            <Button
              tone="danger"
              block
              onClick={() => {
                melt(alloy.id)
                onClose()
              }}
            >
              Confirm melt
            </Button>
          ) : (
            <Button tone="danger" block disabled={busy} onClick={() => setConfirming(true)}>
              <Icon name="flame" size={14} />
              Melt
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
