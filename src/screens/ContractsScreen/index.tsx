import { useMemo, useState } from 'react'
import { useGame } from '@/state/store'
import { CONTRACTS, type Contract } from '@/state/content'
import { RARITIES, RARITY_ORDER } from '@/lib/rarity'
import type { Alloy } from '@/lib/types'
import { metalById } from '@/lib/metals'
import { Panel } from '@/components/ui/Panel'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { EmptyState } from '@/components/ui/EmptyState'
import { ScreenHeader, Figure } from '@/components/layout/ScreenHeader'
import { AlloyPicker } from '@/components/game/AlloyPicker'
import { compact } from '@/lib/format'
import './ContractsScreen.css'

/* Clauses are evaluated separately as well as together: a card that marks each
   clause by whether *any* ingot meets it tells you which requirement you are
   short on, rather than just that you have no complete match. */

const meetsRarity = (alloy: Alloy, contract: Contract) =>
  RARITY_ORDER.indexOf(alloy.rarity) >= RARITY_ORDER.indexOf(contract.minRarity)

const meetsMetals = (alloy: Alloy, contract: Contract) => {
  const held = new Set(alloy.components.map((c) => c.metalId))
  return contract.requiresMetals.every((id) => held.has(id))
}

const meetsPurity = (alloy: Alloy, contract: Contract) => alloy.purity >= contract.minPurity

/** An alloy satisfies an order only on every clause at once. */
function qualifies(alloy: Alloy, contract: Contract): boolean {
  if (alloy.expeditionId) return false
  return meetsRarity(alloy, contract) && meetsMetals(alloy, contract) && meetsPurity(alloy, contract)
}

export function ContractsScreen() {
  const alloys = useGame((s) => s.alloys)
  const quotes = useGame((s) => s.quotes)
  const fulfilled = useGame((s) => s.fulfilled)
  const fulfil = useGame((s) => s.fulfil)
  const setScreen = useGame((s) => s.setScreen)

  const [openId, setOpenId] = useState<string | null>(null)

  const eligibility = useMemo(() => {
    const map: Record<string, Alloy[]> = {}
    for (const contract of CONTRACTS) {
      map[contract.id] = alloys.filter((a) => qualifies(a, contract))
    }
    return map
  }, [alloys])

  const active = CONTRACTS.find((c) => c.id === openId)
  const open = CONTRACTS.length - fulfilled.length

  return (
    <div className="screen contracts">
      <ScreenHeader
        title="Contracts"
        subtitle="Standing orders from the guilds. Deliver an ingot that meets every clause and the order pays out — the ingot itself is consumed."
      >
        <Figure label="Open" value={String(open)} tone="brass" />
        <Figure label="Delivered" value={String(fulfilled.length)} />
      </ScreenHeader>

      <div className="contracts__grid">
        {CONTRACTS.map((contract) => {
          const done = fulfilled.includes(contract.id)
          const candidates = eligibility[contract.id] ?? []
          const rarity = RARITIES[contract.minRarity]!

          const usable = alloys.filter((a) => !a.expeditionId)
          const clauses = [
            {
              label: `${rarity.name} or better`,
              met: usable.some((a) => meetsRarity(a, contract)),
              icon: 'rune' as const,
            },
            {
              label: `Contains ${contract.requiresMetals.map((id) => metalById(id).ticker).join(' + ')}`,
              met: usable.some((a) => meetsMetals(a, contract)),
              icon: 'ingot' as const,
            },
            {
              label: `Purity ${contract.minPurity}+`,
              met: usable.some((a) => meetsPurity(a, contract)),
              icon: 'shard' as const,
            },
          ]

          return (
            <article key={contract.id} className={`order${done ? ' order--done' : ''}`}>
              <div className="order__head">
                <div>
                  <div className="order__issuer">{contract.issuer}</div>
                  <h3 className="order__title">{contract.title}</h3>
                </div>
                <span className="order__expiry">
                  {done ? 'delivered' : `${contract.expiresInHours}h left`}
                </span>
              </div>

              <p className="order__brief">&ldquo;{contract.brief}&rdquo;</p>

              <div className="order__reqs">
                {clauses.map((clause) => (
                  <div
                    key={clause.label}
                    className={`order__req${clause.met && !done ? ' order__req--met' : ''}`}
                  >
                    <Icon name={clause.icon} size={13} className="order__req-icon" />
                    {clause.label}
                  </div>
                ))}
              </div>

              <div className="order__rewards">
                <span className="order__reward">
                  <Icon name="ingot" size={13} />
                  {compact(contract.rewardAlloyToken)}
                </span>
                <span className="order__reward">
                  <Icon name="shard" size={13} />
                  {compact(contract.rewardShards)}
                </span>
              </div>

              <div className="order__foot">
                <span className="order__eligible">
                  {done
                    ? 'order closed'
                    : candidates.length > 0
                      ? `${candidates.length} ingot${candidates.length === 1 ? ' qualifies' : 's qualify'}`
                      : 'nothing qualifies yet'}
                </span>
                <div className="spacer" />
                <Button
                  tone={candidates.length > 0 && !done ? 'ember' : 'ghost'}
                  size="sm"
                  disabled={done || candidates.length === 0}
                  onClick={() => setOpenId(contract.id)}
                >
                  {done ? 'Delivered' : 'Deliver'}
                </Button>
              </div>
            </article>
          )
        })}
      </div>

      {alloys.length === 0 && (
        <Panel>
          <EmptyState
            icon="scroll"
            title="Nothing to deliver"
            body="Orders are paid in $ALLOY and shards, but they need an ingot that meets every clause. Forge a few and come back."
            action={
              <Button tone="ember" onClick={() => setScreen('forge')}>
                To the forge
              </Button>
            }
          />
        </Panel>
      )}

      <AlloyPicker
        open={Boolean(active)}
        title={active ? `Deliver: ${active.title}` : ''}
        blurb="Only ingots meeting every clause are shown. Delivering consumes the ingot and releases its escrow to the guild."
        candidates={active ? (eligibility[active.id] ?? []) : []}
        quotes={quotes}
        onConfirm={(ids) => {
          if (active && ids[0]) fulfil(active.id, ids[0])
          setOpenId(null)
        }}
        onClose={() => setOpenId(null)}
      />
    </div>
  )
}
