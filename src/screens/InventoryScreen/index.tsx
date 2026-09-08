import { useMemo, useState } from 'react'
import { useGame } from '@/state/store'
import { RARITIES, RARITY_ORDER, lockedValue, redeemValue } from '@/lib/rarity'
import type { Alloy, RarityId } from '@/lib/types'
import { Panel } from '@/components/ui/Panel'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ScreenHeader, Figure } from '@/components/layout/ScreenHeader'
import { AlloyCard } from '@/components/game/AlloyCard'
import { AlloyDetail } from './AlloyDetail'
import { usd } from '@/lib/format'
import './InventoryScreen.css'

type SortKey = 'newest' | 'rarity' | 'yield' | 'value'

const SORTS: { id: SortKey; label: string }[] = [
  { id: 'newest', label: 'Newest' },
  { id: 'rarity', label: 'Rarity' },
  { id: 'yield', label: 'Yield' },
  { id: 'value', label: 'Value' },
]

export function InventoryScreen() {
  const alloys = useGame((s) => s.alloys)
  const quotes = useGame((s) => s.quotes)
  const setScreen = useGame((s) => s.setScreen)

  const [sort, setSort] = useState<SortKey>('newest')
  const [tiers, setTiers] = useState<RarityId[]>([])
  const [open, setOpen] = useState<string | null>(null)

  const toggleTier = (id: RarityId) =>
    setTiers((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))

  const shown = useMemo(() => {
    const filtered = tiers.length ? alloys.filter((a) => tiers.includes(a.rarity)) : alloys
    const ranked = [...filtered]
    ranked.sort((a, b) => {
      switch (sort) {
        case 'rarity':
          return RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity)
        case 'yield':
          return b.yieldPerDay - a.yieldPerDay
        case 'value':
          return redeemValue(b, quotes) - redeemValue(a, quotes)
        default:
          return b.forgedAt - a.forgedAt
      }
    })
    return ranked
  }, [alloys, tiers, sort, quotes])

  const totals = useMemo(() => {
    const locked = alloys.reduce((sum, a) => sum + lockedValue(a), 0)
    const redeem = alloys.reduce((sum, a) => sum + redeemValue(a, quotes), 0)
    const daily = alloys.reduce((sum, a) => sum + (a.slot !== null ? a.yieldPerDay : 0), 0)
    return { locked, redeem, daily }
  }, [alloys, quotes])

  const selected: Alloy | null = alloys.find((a) => a.id === open) ?? null

  return (
    <div className="screen inv">
      <ScreenHeader
        title="Inventory"
        subtitle="Every ingot holds real stock in escrow. Melt one and the underlying comes back to you at its live mark."
      >
        <Figure label="Ingots" value={String(alloys.length)} />
        <Figure label="Stock locked" value={usd(totals.locked)} tone="brass" />
        <Figure
          label="Melt value"
          value={usd(totals.redeem)}
          tone={totals.redeem >= totals.locked * 0.9 ? 'gain' : 'loss'}
        />
        <Figure label="Earning" value={`${totals.daily.toFixed(1)}/day`} />
      </ScreenHeader>

      {alloys.length === 0 ? (
        <Panel>
          <EmptyState
            icon="chest"
            title="The bench is empty"
            body="Nothing has been pulled from the crucible yet. Load two or three metals into the forge and pour your first ingot."
            action={
              <Button tone="ember" onClick={() => setScreen('forge')}>
                To the forge
              </Button>
            }
          />
        </Panel>
      ) : (
        <>
          <Panel variant="sunk" className="inv__filters">
            <div className="inv__group">
              <span className="inv__group-label">Sort</span>
              {SORTS.map((option) => (
                <button
                  key={option.id}
                  className={`chip${sort === option.id ? ' chip--on' : ''}`}
                  onClick={() => setSort(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="spacer" />

            <div className="inv__group">
              <span className="inv__group-label">Tier</span>
              {RARITY_ORDER.map((id) => (
                <button
                  key={id}
                  className={`chip chip--rarity${tiers.includes(id) ? ' chip--on' : ''}`}
                  style={{ ['--chip-tone' as string]: RARITIES[id]!.color }}
                  onClick={() => toggleTier(id)}
                >
                  {RARITIES[id]!.name}
                </button>
              ))}
            </div>
          </Panel>

          {shown.length === 0 ? (
            <Panel>
              <EmptyState
                icon="chest"
                title="Nothing at that tier"
                body="No ingot on the bench matches the filter. Clear it to see the rest of your holdings."
                action={<Button onClick={() => setTiers([])}>Clear filter</Button>}
              />
            </Panel>
          ) : (
            <div className="inv__grid">
              {shown.map((alloy) => (
                <AlloyCard
                  key={alloy.id}
                  alloy={alloy}
                  quotes={quotes}
                  onClick={() => setOpen(alloy.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <AlloyDetail alloy={selected} quotes={quotes} onClose={() => setOpen(null)} />
    </div>
  )
}
