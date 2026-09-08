/** Shared domain vocabulary for the forge. */

export type MetalKind = 'equity' | 'crypto'

export interface Metal {
  id: string
  /** In-world name, e.g. NVidium. */
  name: string
  /** In-world ticker shown on the ingot, e.g. NVD. */
  ticker: string
  /** The real asset held in escrow behind it. */
  underlying: string
  kind: MetalKind
  /** Body colour of the cast ingot. */
  hue: string
  /** Specular highlight rolled across the ingot face. */
  sheen: string
  /** One-line flavour describing what the metal contributes to an alloy. */
  trait: string
  /** Which alloy stat this metal biases when it dominates a melt. */
  affinity: 'purity' | 'yield' | 'resonance' | 'integrity'
  basePrice: number
  /** Daily sigma, drives the random walk and the rarity swing. */
  volatility: number
}

export interface Quote {
  metalId: string
  price: number
  prevClose: number
  changePct: number
  /** Rolling window of recent prices, oldest first. Drives sparklines. */
  history: number[]
}

export type RarityId = 'dross' | 'tempered' | 'runed' | 'ascendant' | 'mythril' | 'singularity'

export interface Rarity {
  id: RarityId
  name: string
  color: string
  /** Multiplier applied to the alloy's daily shard yield. */
  yieldMult: number
  /** Lowest stat roll this tier can produce, 0-100. */
  statFloor: number
}

export interface AlloyComponent {
  metalId: string
  /** Share of the melt, 0-1, summing to 1 across the alloy. */
  weight: number
  /** Dollars of the underlying escrowed into this component at forge time. */
  lockedUsd: number
  /** Unit price when the component was escrowed, for redeem maths. */
  lockedAt: number
}

export interface Alloy {
  id: string
  name: string
  serial: number
  rarity: RarityId
  components: AlloyComponent[]
  /** 0-100. Drives shard yield alongside rarity. */
  purity: number
  /** 0-100. Expedition success and raid attack. */
  resonance: number
  /** 0-100. Raid defence. */
  integrity: number
  /** Shards per day when slotted in the smithy. */
  yieldPerDay: number
  bandUsd: number
  overclock: number
  /** The forge cracked: yield halved, but the escrow is untouched. */
  cracked: boolean
  /** Forged on a red tape or a closed feed: lower rarity ceiling, richer yield. */
  coldForged: boolean
  forgedAt: number
  /** Smithy slot index, or null when idle. */
  slot: number | null
  /** Set while the alloy is away on an expedition. */
  expeditionId: string | null
}

export type ScreenId =
  | 'forge'
  | 'inventory'
  | 'smithy'
  | 'market'
  | 'contracts'
  | 'research'
  | 'hall'
