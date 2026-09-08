import type { RarityId } from '@/lib/types'

/* ------------------------------------------------------------------ *
 * Contracts — standing orders. Fulfil one by burning a matching alloy.
 * ------------------------------------------------------------------ */

export interface Contract {
  id: string
  issuer: string
  title: string
  brief: string
  /** Minimum rarity the delivered alloy must reach. */
  minRarity: RarityId
  /** Metal tickers that must all appear in the alloy. */
  requiresMetals: string[]
  /** Minimum purity, 0-100. */
  minPurity: number
  rewardAlloyToken: number
  rewardShards: number
  /** Hours from session start until the order lapses. */
  expiresInHours: number
}

export const CONTRACTS: Contract[] = [
  {
    id: 'c_foundry_01',
    issuer: 'Foundry Guild',
    title: 'Compute Requisition',
    brief: 'The guild wants silicon in the mix and will not take excuses about the tape.',
    minRarity: 'runed',
    requiresMetals: ['nvd'],
    minPurity: 45,
    rewardAlloyToken: 320,
    rewardShards: 140,
    expiresInHours: 11,
  },
  {
    id: 'c_assay_02',
    issuer: 'Assayer’s Office',
    title: 'Certified Pure',
    brief: 'One ingot, refined past the ninetieth mark. Nothing cracked, nothing cold.',
    minRarity: 'tempered',
    requiresMetals: ['apl'],
    minPurity: 88,
    rewardAlloyToken: 210,
    rewardShards: 260,
    expiresInHours: 26,
  },
  {
    id: 'c_warband_03',
    issuer: 'Warband Quartermaster',
    title: 'Armour For The Line',
    brief: 'Dense stock only. It has to survive being hit by people who mean it.',
    minRarity: 'runed',
    requiresMetals: ['mtc'],
    minPurity: 30,
    rewardAlloyToken: 265,
    rewardShards: 180,
    expiresInHours: 40,
  },
  {
    id: 'c_oracle_04',
    issuer: 'Oracle Conclave',
    title: 'Read The Long Tape',
    brief: 'Palantirium and nothing less than Ascendant. They are betting on the roll.',
    minRarity: 'ascendant',
    requiresMetals: ['plt'],
    minPurity: 60,
    rewardAlloyToken: 900,
    rewardShards: 520,
    expiresInHours: 58,
  },
  {
    id: 'c_smelter_05',
    issuer: 'Smelter’s Union',
    title: 'Two-Metal Bloom',
    brief: 'A clean binary melt. Teslite and Amdium, and keep the crucible honest.',
    minRarity: 'tempered',
    requiresMetals: ['tes', 'amd'],
    minPurity: 25,
    rewardAlloyToken: 175,
    rewardShards: 120,
    expiresInHours: 17,
  },
]

/* ------------------------------------------------------------------ *
 * Research — four branches, each node bought with shards.
 * ------------------------------------------------------------------ */

export type ResearchBranch = 'crucible' | 'bellows' | 'ledger' | 'warband'

export interface ResearchNode {
  id: string
  branch: ResearchBranch
  name: string
  description: string
  maxLevel: number
  /** Shard cost of the first level; each level costs 60% more. */
  baseCost: number
  /** Node ids that must be at level 1 before this unlocks. */
  requires: string[]
  /** Per-level effect, rendered next to the node. */
  effect: string
}

export const RESEARCH_BRANCHES: Record<ResearchBranch, { name: string; blurb: string; color: string }> = {
  crucible: {
    name: 'Crucible',
    blurb: 'What the forge can hold and how cleanly it pours.',
    color: 'var(--ember-200)',
  },
  bellows: {
    name: 'Bellows',
    blurb: 'How hard you can push the heat before it bites.',
    color: 'var(--loss)',
  },
  ledger: {
    name: 'Ledger',
    blurb: 'Escrow terms, melt rates and what the protocol keeps.',
    color: 'var(--brass-200)',
  },
  warband: {
    name: 'Warband',
    blurb: 'Expeditions, raiding, and holding what is yours.',
    color: 'var(--arcane-300)',
  },
}

export const RESEARCH_NODES: ResearchNode[] = [
  {
    id: 'deeper_crucible',
    branch: 'crucible',
    name: 'Deeper Crucible',
    description: 'Line the vessel to hold another ingot at rest.',
    maxLevel: 3,
    baseCost: 400,
    requires: [],
    effect: '+1 smithy slot',
  },
  {
    id: 'refined_flux',
    branch: 'crucible',
    name: 'Refined Flux',
    description: 'Skim the melt before it sets. Nothing common survives it.',
    maxLevel: 4,
    baseCost: 550,
    requires: ['deeper_crucible'],
    effect: '+3 purity floor',
  },
  {
    id: 'stabilisers',
    branch: 'crucible',
    name: 'Stabilisers',
    description: 'Iron collars around the vessel. The heat still climbs, the walls hold.',
    maxLevel: 4,
    baseCost: 700,
    requires: ['refined_flux'],
    effect: '-4% crack risk',
  },
  {
    id: 'forced_draught',
    branch: 'bellows',
    name: 'Forced Draught',
    description: 'Push past the safe stop on the overclock arm.',
    maxLevel: 3,
    baseCost: 500,
    requires: [],
    effect: '+8 max overclock',
  },
  {
    id: 'heat_retention',
    branch: 'bellows',
    name: 'Heat Retention',
    description: 'The crucible remembers the last green candle a little longer.',
    maxLevel: 3,
    baseCost: 820,
    requires: ['forced_draught'],
    effect: '+0.05 effective temperature',
  },
  {
    id: 'cold_mastery',
    branch: 'bellows',
    name: 'Cold Mastery',
    description: 'Work the red tape deliberately instead of enduring it.',
    maxLevel: 3,
    baseCost: 760,
    requires: ['forced_draught'],
    effect: '+10% cold-forge yield',
  },
  {
    id: 'favourable_terms',
    branch: 'ledger',
    name: 'Favourable Terms',
    description: 'Argue the melt rate up a point at a time.',
    maxLevel: 4,
    baseCost: 900,
    requires: [],
    effect: '+0.5% melt return',
  },
  {
    id: 'escrow_insight',
    branch: 'ledger',
    name: 'Escrow Insight',
    description: 'See the mark against the lock before you commit.',
    maxLevel: 1,
    baseCost: 600,
    requires: [],
    effect: 'Show live redeem delta',
  },
  {
    id: 'fee_rebate',
    branch: 'ledger',
    name: 'Fee Rebate',
    description: 'A larger cut of the swap fee finds its way back to your bench.',
    maxLevel: 3,
    baseCost: 1100,
    requires: ['favourable_terms'],
    effect: '+4% shard claim',
  },
  {
    id: 'long_marches',
    branch: 'warband',
    name: 'Long Marches',
    description: 'Crews that walk further and come back with more.',
    maxLevel: 3,
    baseCost: 480,
    requires: [],
    effect: '+12% expedition reward',
  },
  {
    id: 'raiding_party',
    branch: 'warband',
    name: 'Raiding Party',
    description: 'Hit harder when you go over someone else’s wall.',
    maxLevel: 4,
    baseCost: 640,
    requires: [],
    effect: '+6 raid power',
  },
  {
    id: 'ward_stones',
    branch: 'warband',
    name: 'Ward Stones',
    description: 'Unclaimed shards behind a wall worth the walk.',
    maxLevel: 4,
    baseCost: 640,
    requires: ['raiding_party'],
    effect: '+6 raid defence',
  },
]

export const researchCost = (node: ResearchNode, currentLevel: number): number =>
  Math.round(node.baseCost * Math.pow(1.6, currentLevel))

/* ------------------------------------------------------------------ *
 * Expeditions — send alloys out, get them back with shards.
 * ------------------------------------------------------------------ */

export interface ExpeditionRoute {
  id: string
  name: string
  blurb: string
  durationHours: number
  /** Resonance needed for an even-odds run. */
  parResonance: number
  rewardShards: number
  rewardAlloyToken: number
  /** Slots an expedition consumes. */
  crewSize: number
}

export const EXPEDITION_ROUTES: ExpeditionRoute[] = [
  {
    id: 'ashfields',
    name: 'The Ashfields',
    blurb: 'A short walk over burnt ground. Low risk, honest pay.',
    durationHours: 4,
    parResonance: 30,
    rewardShards: 180,
    rewardAlloyToken: 40,
    crewSize: 1,
  },
  {
    id: 'slagreach',
    name: 'Slagreach Deep',
    blurb: 'Down where the old melts were dumped. Something down there still pays.',
    durationHours: 12,
    parResonance: 55,
    rewardShards: 640,
    rewardAlloyToken: 150,
    crewSize: 2,
  },
  {
    id: 'oracle_span',
    name: 'The Oracle Span',
    blurb: 'A full day out along the feed lines. Bring your best.',
    durationHours: 24,
    parResonance: 78,
    rewardShards: 1650,
    rewardAlloyToken: 420,
    crewSize: 3,
  },
]

export interface Expedition {
  id: string
  routeId: string
  alloyIds: string[]
  startedAt: number
  endsAt: number
  /** Resolved success chance, frozen at dispatch so the UI can show it. */
  successChance: number
}

/* ------------------------------------------------------------------ *
 * Raid targets.
 * ------------------------------------------------------------------ */

export interface Rival {
  id: string
  handle: string
  rank: number
  /** Shards sitting unclaimed in their smithy, i.e. what you can take. */
  exposed: number
  defence: number
  /** Cinder cost to open the raid. */
  cost: number
}

export const RIVALS: Rival[] = [
  { id: 'r1', handle: 'slagbaron.eth', rank: 4, exposed: 2140, defence: 74, cost: 2 },
  { id: 'r2', handle: 'Coldsmith_9', rank: 11, exposed: 1380, defence: 58, cost: 2 },
  { id: 'r3', handle: 'vault_of_ash', rank: 23, exposed: 890, defence: 41, cost: 1 },
  { id: 'r4', handle: 'MOLTEN_MAXI', rank: 6, exposed: 1960, defence: 69, cost: 2 },
  { id: 'r5', handle: 'quenchgirl', rank: 38, exposed: 460, defence: 27, cost: 1 },
  { id: 'r6', handle: '0xBellows', rank: 15, exposed: 1120, defence: 52, cost: 2 },
]

/* ------------------------------------------------------------------ *
 * Season ladder.
 * ------------------------------------------------------------------ */

export interface LadderEntry {
  rank: number
  handle: string
  ingots: number
  score: number
  /** Share of the ETH purse, 0-1. */
  share: number
}

/** Top-heavy but not brutal: rank 1 takes 18%, the tail still eats. */
function payoutShare(rank: number, field: number): number {
  const weight = 1 / Math.pow(rank, 0.85)
  let total = 0
  for (let i = 1; i <= field; i++) total += 1 / Math.pow(i, 0.85)
  return weight / total
}

const LADDER_HANDLES = [
  'slagbaron.eth', 'Emberwright', 'MOLTEN_MAXI', 'nvda_or_nothing', 'Coldsmith_9',
  '0xBellows', 'anvil.eth', 'quench_king', 'tape_reader', 'vault_of_ash',
  'Hammerfell', 'PONS_pilled', 'dross_dealer', 'quenchgirl', 'the_assayer',
  'greenday_gary', 'Ironmonger', 'forgefiend', 'redcandle', 'last_pour',
]

export const SEASON = {
  number: 3,
  name: 'The Long Pour',
  /** Days remaining in the season, from session start. */
  daysRemaining: 12,
  purseEth: 41.8,
  field: LADDER_HANDLES.length,
}

export const LADDER: LadderEntry[] = LADDER_HANDLES.map((handle, i) => {
  const rank = i + 1
  return {
    rank,
    handle,
    ingots: Math.round(340 / Math.pow(rank, 0.55)),
    score: Math.round(98_400 / Math.pow(rank, 0.72)),
    share: payoutShare(rank, LADDER_HANDLES.length),
  }
})

/** Where the player sits until they climb. */
export const PLAYER_RANK = 27
