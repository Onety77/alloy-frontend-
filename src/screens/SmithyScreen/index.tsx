import { useEffect, useMemo, useState } from 'react'
import { useGame } from '@/state/store'
import { usePerks } from '@/state/selectors'
import { EXPEDITION_ROUTES, RIVALS } from '@/state/content'
import { Panel, SectionHeading } from '@/components/ui/Panel'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { EmptyState } from '@/components/ui/EmptyState'
import { ScreenHeader, Figure } from '@/components/layout/ScreenHeader'
import { AlloyCard } from '@/components/game/AlloyCard'
import { AlloyPicker } from '@/components/game/AlloyPicker'
import { compact, duration } from '@/lib/format'
import './SmithyScreen.css'

export function SmithyScreen() {
  const alloys = useGame((s) => s.alloys)
  const quotes = useGame((s) => s.quotes)
  const unclaimed = useGame((s) => s.unclaimed)
  const claim = useGame((s) => s.claim)
  const slotAlloy = useGame((s) => s.slotAlloy)
  const unslotAlloy = useGame((s) => s.unslotAlloy)
  const expeditions = useGame((s) => s.expeditions)
  const dispatch = useGame((s) => s.dispatch)
  const collect = useGame((s) => s.collectExpedition)
  const raid = useGame((s) => s.raid)
  const raided = useGame((s) => s.raided)
  const cinder = useGame((s) => s.wallet.cinder)
  const setScreen = useGame((s) => s.setScreen)
  const perks = usePerks()

  const [picking, setPicking] = useState<'slot' | string | null>(null)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const slotted = useMemo(
    () => alloys.filter((a) => a.slot !== null).sort((a, b) => a.slot! - b.slot!),
    [alloys],
  )
  const idle = useMemo(
    () => alloys.filter((a) => a.slot === null && !a.expeditionId),
    [alloys],
  )
  const perDay = slotted.reduce((sum, a) => sum + a.yieldPerDay, 0)

  const activeRoute = typeof picking === 'string' && picking !== 'slot'
    ? EXPEDITION_ROUTES.find((r) => r.id === picking)
    : undefined

  return (
    <div className="screen smithy">
      <ScreenHeader
        title="Smithy"
        subtitle="Slotted ingots draw shards around the clock. Anything you have not claimed is exposed — a rival can take a share of it."
      >
        <Figure label="Slots" value={`${slotted.length}/${perks.slots}`} />
        <Figure label="Draw" value={`${perDay.toFixed(1)}/day`} tone="brass" />
        <Figure label="Cinder" value={String(cinder)} />
      </ScreenHeader>

      <Panel rivets className="vault">
        <div className="vault__figure">
          <span className="vault__label">Unclaimed shards</span>
          <span className="vault__amount">
            {unclaimed.toFixed(1)}
            <span className="vault__unit">shards</span>
          </span>
        </div>

        <div className="vault__figure">
          <span className="vault__label">Accruing</span>
          <span className="vault__rate">
            {perDay > 0 ? `${(perDay / 24).toFixed(2)} / hour` : 'nothing slotted'}
          </span>
        </div>

        <div className="spacer" />

        {unclaimed >= 1 && (
          <span className="vault__warn">
            <Icon name="skull" size={13} />
            Exposed to raids until claimed
          </span>
        )}

        <Button tone="ember" disabled={unclaimed < 0.01} onClick={() => claim()}>
          <Icon name="shard" size={14} />
          Claim {unclaimed >= 1 ? Math.floor(unclaimed) : ''}
        </Button>
      </Panel>

      <Panel className="smithy__section">
          <SectionHeading>Bench Slots</SectionHeading>

          <div className="slots-grid">
            {Array.from({ length: Math.max(perks.slots, 3) }, (_, i) => {
              const occupant = slotted.find((a) => a.slot === i)
              const locked = i >= perks.slots

              if (occupant) {
                return (
                  <div key={i} className="slot-filled">
                    <span className="slot-filled__rate">{occupant.yieldPerDay.toFixed(1)}/d</span>
                    <AlloyCard
                      alloy={occupant}
                      quotes={quotes}
                      onClick={() => unslotAlloy(occupant.id)}
                    />
                  </div>
                )
              }

              return (
                <button
                  key={i}
                  className={`forge-slot${locked ? ' forge-slot--locked' : ''}`}
                  disabled={locked}
                  onClick={() => setPicking('slot')}
                >
                  <span className="forge-slot__num">{String(i + 1).padStart(2, '0')}</span>
                  <Icon name={locked ? 'lock' : 'anvil'} size={26} />
                  <span className="forge-slot__hint">
                    {locked ? 'Research to unlock' : 'Slot an ingot'}
                  </span>
                </button>
              )
            })}
          </div>
      </Panel>

      <div className="smithy__cols">
          <Panel className="smithy__section">
            <SectionHeading>Expeditions</SectionHeading>

            {expeditions.map((expedition) => {
              const route = EXPEDITION_ROUTES.find((r) => r.id === expedition.routeId)!
              const total = expedition.endsAt - expedition.startedAt
              const done = now >= expedition.endsAt
              const progress = Math.min(100, ((now - expedition.startedAt) / total) * 100)

              return (
                <div key={expedition.id} className="route">
                  <div className="route__head">
                    <span className="route__name">{route.name}</span>
                    <span className="route__time">
                      {done ? 'returned' : duration(expedition.endsAt - now)}
                    </span>
                  </div>
                  <div className="route__progress">
                    <span className="meter">
                      <span className="meter__fill" style={{ width: `${progress}%` }} />
                    </span>
                    <span className="route__odds">
                      {expedition.alloyIds.length} away &middot;{' '}
                      {Math.round(expedition.successChance * 100)}% odds
                    </span>
                  </div>
                  {done && (
                    <Button tone="ember" size="sm" onClick={() => collect(expedition.id)}>
                      Collect
                    </Button>
                  )}
                </div>
              )
            })}

            {EXPEDITION_ROUTES.map((route) => {
              const running = expeditions.some((e) => e.routeId === route.id)
              if (running) return null

              return (
                <div key={route.id} className="route">
                  <div className="route__head">
                    <span className="route__name">{route.name}</span>
                    <span className="route__time">{route.durationHours}h</span>
                  </div>
                  <p className="route__blurb">{route.blurb}</p>
                  <div className="route__foot">
                    <span className="route__reward">
                      <Icon name="shard" size={12} />
                      {compact(route.rewardShards)}
                    </span>
                    <span className="route__reward">
                      <Icon name="ingot" size={12} />
                      {compact(route.rewardAlloyToken)}
                    </span>
                    <span className="route__odds">crew of {route.crewSize}</span>
                    <div className="spacer" />
                    <Button
                      size="sm"
                      disabled={idle.length < route.crewSize}
                      onClick={() => setPicking(route.id)}
                    >
                      Dispatch
                    </Button>
                  </div>
                </div>
              )
            })}
          </Panel>

          <Panel className="smithy__section">
            <SectionHeading>Raids</SectionHeading>
            <p className="route__blurb" style={{ marginTop: -4 }}>
              Rival benches with shards sitting unclaimed. Your attack scales with the resonance of
              what you have slotted.
            </p>

            {RIVALS.map((rival) => {
              const spent = Boolean(raided[rival.id])
              return (
                <div key={rival.id} className={`rival${spent ? ' rival--spent' : ''}`}>
                  <span>
                    <span className="rival__handle">{rival.handle}</span>
                    <br />
                    <span className="rival__meta">
                      rank {rival.rank} &middot; defence {rival.defence}
                    </span>
                  </span>
                  <span className="rival__exposed">
                    <span className="rival__amount">{compact(rival.exposed)}</span>
                    <span className="rival__label">exposed</span>
                  </span>
                  <Button
                    size="sm"
                    tone={spent ? 'ghost' : 'iron'}
                    disabled={spent || cinder < rival.cost}
                    onClick={() => raid(rival.id)}
                  >
                    {spent ? 'Raided' : `Raid · ${rival.cost}`}
                  </Button>
                </div>
              )
            })}
          </Panel>
      </div>

      {alloys.length === 0 && (
        <Panel>
          <EmptyState
            icon="hammer"
            title="Nothing to put to work"
            body="The smithy earns from ingots left in its slots. Forge one first, then slot it here and it will draw shards while you are away."
            action={
              <Button tone="ember" onClick={() => setScreen('forge')}>
                To the forge
              </Button>
            }
          />
        </Panel>
      )}

      <AlloyPicker
        open={picking === 'slot'}
        title="Slot an ingot"
        blurb="Slotted ingots draw shards continuously. You can pull one out at any time."
        candidates={idle}
        quotes={quotes}
        onConfirm={(ids) => {
          if (ids[0]) slotAlloy(ids[0])
          setPicking(null)
        }}
        onClose={() => setPicking(null)}
      />

      <AlloyPicker
        open={Boolean(activeRoute)}
        title={`Crew for ${activeRoute?.name ?? ''}`}
        blurb={`Success scales with the crew's average resonance against a par of ${activeRoute?.parResonance ?? 0}. Ingots are unavailable until they return.`}
        candidates={idle}
        quotes={quotes}
        need={activeRoute?.crewSize ?? 1}
        confirmLabel="Dispatch"
        onConfirm={(ids) => {
          if (activeRoute) dispatch(activeRoute.id, ids)
          setPicking(null)
        }}
        onClose={() => setPicking(null)}
      />
    </div>
  )
}
