import { useState } from 'react'
import { useGame } from '@/state/store'
import { usePerks } from '@/state/selectors'
import {
  RESEARCH_BRANCHES,
  RESEARCH_NODES,
  researchCost,
  type ResearchBranch,
} from '@/state/content'
import { Panel } from '@/components/ui/Panel'
import { Icon } from '@/components/ui/Icon'
import { Button } from '@/components/ui/Button'
import { ScreenHeader, Figure } from '@/components/layout/ScreenHeader'
import { compact } from '@/lib/format'
import './ResearchScreen.css'

const BRANCH_ORDER: ResearchBranch[] = ['crucible', 'bellows', 'ledger', 'warband']

export function ResearchScreen() {
  const research = useGame((s) => s.research)
  const shards = useGame((s) => s.wallet.shards)
  const buy = useGame((s) => s.buyResearch)
  const resetBench = useGame((s) => s.resetBench)
  const perks = usePerks()
  const [confirmReset, setConfirmReset] = useState(false)

  const invested = RESEARCH_NODES.reduce((sum, node) => {
    const level = research[node.id] ?? 0
    let total = 0
    for (let i = 0; i < level; i++) total += researchCost(node, i)
    return sum + total
  }, 0)

  const levels = Object.values(research).reduce((a, b) => a + b, 0)

  return (
    <div className="screen research">
      <ScreenHeader
        title="Research"
        subtitle="Shards buy permanent upgrades to the bench. Every level applies to the next pour — nothing here is consumable."
      >
        <Figure label="Shards" value={compact(shards)} tone="brass" />
        <Figure label="Levels" value={String(levels)} />
        <Figure label="Invested" value={compact(invested)} />
      </ScreenHeader>

      <div className="research__branches">
        {BRANCH_ORDER.map((branchId) => {
          const branch = RESEARCH_BRANCHES[branchId]
          const nodes = RESEARCH_NODES.filter((n) => n.branch === branchId)

          return (
            <Panel
              key={branchId}
              rivets
              className="branch"
              style={{ ['--branch' as string]: branch.color }}
            >
              <div className="branch__head">
                <span className="branch__name">{branch.name}</span>
                <span className="branch__blurb">{branch.blurb}</span>
              </div>

              {nodes.map((node) => {
                const level = research[node.id] ?? 0
                const maxed = level >= node.maxLevel
                const locked = node.requires.some((req) => (research[req] ?? 0) < 1)
                const cost = researchCost(node, level)
                const affordable = shards >= cost
                const available = !maxed && !locked

                const blockedBy = node.requires
                  .filter((req) => (research[req] ?? 0) < 1)
                  .map((req) => RESEARCH_NODES.find((n) => n.id === req)?.name)
                  .filter(Boolean)

                return (
                  <button
                    key={node.id}
                    className={`node${maxed ? ' node--maxed' : ''}${locked ? ' node--locked' : ''}${
                      available ? ' node--available' : ''
                    }`}
                    disabled={!available || !affordable}
                    onClick={() => buy(node.id)}
                  >
                    <div className="node__head">
                      <span className="node__name">{node.name}</span>
                      <span className="node__pips">
                        {Array.from({ length: node.maxLevel }, (_, i) => (
                          <span
                            key={i}
                            className={`node__pip${i < level ? ' node__pip--on' : ''}`}
                          />
                        ))}
                      </span>
                    </div>

                    <p className="node__desc">{node.description}</p>

                    <div className="node__foot">
                      <span className="node__effect">
                        {node.effect}
                        {level > 0 && !maxed ? ` · at ${level}` : ''}
                      </span>
                      {maxed ? (
                        <span className="node__req">maxed</span>
                      ) : locked ? (
                        <span className="node__req">needs {blockedBy[0]}</span>
                      ) : (
                        <span className={`node__cost${affordable ? '' : ' node__cost--short'}`}>
                          <Icon name="shard" size={11} />
                          {compact(cost)}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </Panel>
          )
        })}
      </div>

      <Panel className="branch" style={{ ['--branch' as string]: 'var(--brass-200)' }}>
        <div className="branch__head">
          <span className="branch__name">Bench Standing</span>
          <span className="branch__blurb">Everything research is currently doing for you.</span>
        </div>
        <div className="research__standing">
          <div className="stat-row">
            <span className="stat-row__label">Smithy slots</span>
            <span className="stat-row__value">{perks.slots}</span>
          </div>
          <div className="stat-row">
            <span className="stat-row__label">Overclock cap</span>
            <span className="stat-row__value">{perks.maxOverclock}%</span>
          </div>
          <div className="stat-row">
            <span className="stat-row__label">Melt return</span>
            <span className="stat-row__value">{(perks.meltReturn * 100).toFixed(1)}%</span>
          </div>
          <div className="stat-row">
            <span className="stat-row__label">Crack reduction</span>
            <span className="stat-row__value">{(perks.crackReduction * 100).toFixed(0)}pp</span>
          </div>
          <div className="stat-row">
            <span className="stat-row__label">Raid power</span>
            <span className="stat-row__value">+{perks.raidPower}</span>
          </div>
          <div className="stat-row">
            <span className="stat-row__label">Claim bonus</span>
            <span className="stat-row__value">+{(perks.claimBonus * 100).toFixed(0)}%</span>
          </div>
        </div>

        <div className="research__reset">
          <span className="branch__blurb">
            Clears every ingot, balance and research level on this device.
          </span>
          {confirmReset ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button size="sm" tone="ghost" onClick={() => setConfirmReset(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                tone="danger"
                onClick={() => {
                  resetBench()
                  setConfirmReset(false)
                }}
              >
                Confirm reset
              </Button>
            </div>
          ) : (
            <Button size="sm" tone="ghost" onClick={() => setConfirmReset(true)}>
              Reset bench
            </Button>
          )}
        </div>
      </Panel>
    </div>
  )
}
