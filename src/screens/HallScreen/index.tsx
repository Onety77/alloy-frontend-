import { useMemo } from 'react'
import { useGame } from '@/state/store'
import { LADDER, PLAYER_RANK, SEASON } from '@/state/content'
import { RARITY_ORDER } from '@/lib/rarity'
import { Panel, SectionHeading } from '@/components/ui/Panel'
import { Icon } from '@/components/ui/Icon'
import { ScreenHeader, Figure } from '@/components/layout/ScreenHeader'
import { compact } from '@/lib/format'
import './HallScreen.css'

/** Season score: tier weight and purity, so quality beats volume. */
const TIER_POINTS = [10, 26, 62, 150, 380, 1000]

export function HallScreen() {
  const alloys = useGame((s) => s.alloys)

  const score = useMemo(
    () =>
      Math.round(
        alloys.reduce(
          (sum, a) => sum + TIER_POINTS[RARITY_ORDER.indexOf(a.rarity)]! * (1 + a.purity / 120),
          0,
        ),
      ),
    [alloys],
  )

  // Splice the player into the standings at their current rank.
  const standings = useMemo(() => {
    const rows = LADDER.map((entry) => ({ ...entry, you: false }))
    const you = {
      rank: PLAYER_RANK,
      handle: 'your bench',
      ingots: alloys.length,
      score,
      share: 0,
      you: true,
    }
    return [...rows, you].sort((a, b) => a.rank - b.rank)
  }, [alloys.length, score])

  const topShare = LADDER[0]?.share ?? 1

  return (
    <div className="screen hall">
      <ScreenHeader
        title="Hall of Ingots"
        subtitle="Season standings. The purse is funded from swap fees and settles in ETH when the season closes."
      >
        <Figure label="Your rank" value={`#${PLAYER_RANK}`} tone="brass" />
        <Figure label="Your score" value={compact(score)} />
        <Figure label="Field" value={String(SEASON.field + 1)} />
      </ScreenHeader>

      <Panel rivets className="season">
        <div className="season__id">
          <span className="season__no">Season {SEASON.number}</span>
          <span className="season__name">{SEASON.name}</span>
        </div>

        <div className="spacer" />

        <div className="season__purse">
          <span className="season__purse-label">Prize purse</span>
          <span className="season__purse-value">
            {SEASON.purseEth.toFixed(1)}
            <span className="season__purse-unit">ETH</span>
          </span>
        </div>

        <div className="season__purse">
          <span className="season__purse-label">Closes in</span>
          <span className="season__purse-value" style={{ color: 'var(--brass-200)' }}>
            {SEASON.daysRemaining}
            <span className="season__purse-unit">days</span>
          </span>
        </div>
      </Panel>

      <div className="hall__cols">
        <Panel rivets className="hall__section">
          <SectionHeading>Standings</SectionHeading>

          <div className="ladder">
            <div className="ladder__head">
              <span>Rank</span>
              <span>Smith</span>
              <span style={{ textAlign: 'right' }}>Ingots</span>
              <span style={{ textAlign: 'right' }}>Score</span>
              <span style={{ textAlign: 'right' }}>Payout</span>
            </div>

            {standings.map((row) => (
              <div
                key={`${row.rank}-${row.handle}`}
                className={`ladder__row${row.rank <= 3 && !row.you ? ` ladder__row--${row.rank}` : ''}${
                  row.you ? ' ladder__row--you' : ''
                }`}
              >
                <span className="ladder__rank">
                  {row.rank <= 3 && !row.you ? (
                    <Icon name="crown" size={15} />
                  ) : (
                    String(row.rank).padStart(2, '0')
                  )}
                </span>
                <span className="ladder__handle">
                  {row.handle}
                  {row.you && <span className="ladder__you-tag">you</span>}
                </span>
                <span className="ladder__num">{row.ingots}</span>
                <span className="ladder__num">{compact(row.score)}</span>
                <span className="ladder__payout">
                  {row.share > 0 ? `${(row.share * SEASON.purseEth).toFixed(3)}` : '—'}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Panel rivets className="hall__section">
            <SectionHeading>Purse Split</SectionHeading>
            <p className="detailchart__trait">
              Top-heavy but not winner-take-all. Every rank in the field settles in ETH.
            </p>

            <div className="payout">
              {LADDER.slice(0, 10).map((entry) => (
                <div key={entry.rank} className="payout__row">
                  <span className="payout__rank">#{entry.rank}</span>
                  <span className="payout__track">
                    <span
                      className="payout__fill"
                      style={{ width: `${(entry.share / topShare) * 100}%` }}
                    />
                  </span>
                  <span className="payout__value">
                    {(entry.share * SEASON.purseEth).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel rivets className="hall__section">
            <SectionHeading>Scoring</SectionHeading>
            <div className="stat-rows">
              <div className="stat-row">
                <span className="stat-row__label">Dross</span>
                <span className="stat-row__value">{TIER_POINTS[0]} pts</span>
              </div>
              <div className="stat-row">
                <span className="stat-row__label">Runed</span>
                <span className="stat-row__value">{TIER_POINTS[2]} pts</span>
              </div>
              <div className="stat-row">
                <span className="stat-row__label">Mythril</span>
                <span className="stat-row__value">{TIER_POINTS[4]} pts</span>
              </div>
              <div className="stat-row">
                <span className="stat-row__label">Singularity</span>
                <span className="stat-row__value" style={{ color: 'var(--r-singularity)' }}>
                  {compact(TIER_POINTS[5]!)} pts
                </span>
              </div>
            </div>
            <p className="detailchart__trait">
              Purity scales every tier by up to another 83%, so a well-refined Runed ingot can
              outscore a careless Ascendant.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  )
}
