import type { Alloy, AlloyComponent, Metal, Quote, Rarity, RarityId } from './types'
import { clamp, pick, type Rng } from './rng'

export const RARITY_ORDER: RarityId[] = [
  'dross',
  'tempered',
  'runed',
  'ascendant',
  'mythril',
  'singularity',
]

export const RARITIES: Record<RarityId, Rarity> = {
  dross: { id: 'dross', name: 'Dross', color: '#8b8d93', yieldMult: 1, statFloor: 4 },
  tempered: { id: 'tempered', name: 'Tempered', color: '#7fc98a', yieldMult: 1.35, statFloor: 20 },
  runed: { id: 'runed', name: 'Runed', color: '#59a8e0', yieldMult: 1.9, statFloor: 38 },
  ascendant: { id: 'ascendant', name: 'Ascendant', color: '#a481ef', yieldMult: 2.8, statFloor: 55 },
  mythril: { id: 'mythril', name: 'Mythril', color: '#f0b542', yieldMult: 4.2, statFloor: 71 },
  singularity: { id: 'singularity', name: 'Singularity', color: '#fff3d4', yieldMult: 6.5, statFloor: 86 },
}

/** Neutral-market odds before any heat, overclock or band modifier. */
const BASE_WEIGHTS: Record<RarityId, number> = {
  dross: 46,
  tempered: 30,
  runed: 15,
  ascendant: 6.5,
  mythril: 2.2,
  singularity: 0.3,
}

export const INVESTMENT_BANDS = [10, 25, 100] as const
export type InvestmentBand = (typeof INVESTMENT_BANDS)[number]

/** Band nudges the floor: more escrowed, slightly kinder odds. */
const BAND_BONUS: Record<InvestmentBand, number> = { 10: -0.14, 25: 0, 100: 0.26 }

export interface ForgeInput {
  metals: Metal[]
  quotes: Record<string, Quote>
  band: InvestmentBand
  /** 0-100. Raises the rarity ceiling and the chance of cracking. */
  overclock: number
  /** Weekend crypto window: the equity feeds are shut. */
  coldWindow: boolean
}

export interface ForgeReading {
  /** Weighted price action of the selected metals, -1 (frozen) to 1 (molten). */
  temperature: number
  label: string
  /** Temperature remapped to 0-1 for the gauge needle. */
  heat: number
  crackRisk: number
  odds: Record<RarityId, number>
  /** Yield multiplier earned purely from forging into a red tape. */
  coldBonus: number
  expectedYieldPerDay: number
  coldForged: boolean
}

const TEMPERATURE_BANDS: { at: number; label: string }[] = [
  { at: -0.62, label: 'FROZEN' },
  { at: -0.30, label: 'COLD' },
  { at: -0.14, label: 'COOLING' },
  { at: 0.14, label: 'NEUTRAL' },
  { at: 0.30, label: 'WARM' },
  { at: 0.62, label: 'HOT' },
  { at: Infinity, label: 'MOLTEN' },
]

export const temperatureLabel = (t: number): string =>
  TEMPERATURE_BANDS.find((b) => t < b.at)?.label ?? 'MOLTEN'

/**
 * Market temperature is the volatility-normalised, equally weighted move of
 * everything currently in the crucible. Dividing each move by the metal's own
 * sigma stops Teslite from drowning out Applium simply for being twitchier.
 */
export function readTemperature(metals: Metal[], quotes: Record<string, Quote>): number {
  if (metals.length === 0) return 0
  let sum = 0
  for (const metal of metals) {
    const quote = quotes[metal.id]
    if (!quote) continue
    const sigma = metal.volatility * 100
    sum += clamp(quote.changePct / (sigma * 2.2), -1.2, 1.2)
  }
  return clamp(sum / metals.length, -1, 1)
}

/** Overclocking is cheap until it isn't: risk climbs faster than linearly. */
export const crackRisk = (overclock: number): number =>
  clamp(Math.pow(clamp(overclock, 0, 100) / 100, 1.9) * 0.7, 0, 0.7)

/**
 * Rarity odds. A single `luck` scalar is raised to the power of the tier index,
 * so a hot market barely moves Dross but meaningfully multiplies the top tiers —
 * which is the behaviour the design calls for: a green day makes better loot.
 */
export function rarityOdds(
  temperature: number,
  overclock: number,
  band: InvestmentBand,
): Record<RarityId, number> {
  const luck = clamp(
    1 + temperature * 0.55 + (overclock / 100) * 0.5 + BAND_BONUS[band],
    0.35,
    2.6,
  )

  const weights = {} as Record<RarityId, number>
  let total = 0
  RARITY_ORDER.forEach((id, index) => {
    const w = BASE_WEIGHTS[id] * Math.pow(luck, index)
    weights[id] = w
    total += w
  })

  for (const id of RARITY_ORDER) weights[id] = weights[id]! / total
  return weights
}

/** A red tape forges worse loot that pays better. This is that trade. */
export const coldYieldBonus = (temperature: number): number =>
  1 + Math.max(0, -temperature) * 0.85

export function readForge(input: ForgeInput): ForgeReading {
  const temperature = readTemperature(input.metals, input.quotes)
  const odds = rarityOdds(temperature, input.overclock, input.band)
  const coldBonus = coldYieldBonus(temperature)

  // Expected yield across the odds table, before the purity roll.
  const expectedMult = RARITY_ORDER.reduce(
    (acc, id) => acc + odds[id]! * RARITIES[id]!.yieldMult,
    0,
  )

  return {
    temperature,
    label: temperatureLabel(temperature),
    heat: (temperature + 1) / 2,
    crackRisk: crackRisk(input.overclock),
    odds,
    coldBonus,
    expectedYieldPerDay: baseYield(input.band) * expectedMult * coldBonus,
    coldForged: input.coldWindow || temperature < -0.15,
  }
}

const baseYield = (band: InvestmentBand) => band * 0.42

function rollRarity(odds: Record<RarityId, number>, rng: Rng): RarityId {
  const roll = rng()
  let acc = 0
  for (const id of RARITY_ORDER) {
    acc += odds[id]!
    if (roll <= acc) return id
  }
  return 'dross'
}

const HEAT_PREFIX = [
  { at: -0.62, words: ['Rimebound', 'Deadcast', 'Hoarfrost'] },
  { at: -0.26, words: ['Coldset', 'Slackened', 'Dimmed'] },
  { at: -0.09, words: ['Quenched', 'Settled', 'Stilled'] },
  { at: 0.09, words: ['Even', 'Level', 'Plainstruck'] },
  { at: 0.26, words: ['Warmstruck', 'Kindled', 'Risen'] },
  { at: 0.62, words: ['Emberbound', 'Flarecast', 'Bright'] },
  { at: Infinity, words: ['Moltencast', 'Sunstruck', 'Whitehot'] },
]

const FORMS = ['Ingot', 'Bloom', 'Billet', 'Wafer', 'Core', 'Sigil']

function nameAlloy(metals: Metal[], temperature: number, rng: Rng): string {
  const band = HEAT_PREFIX.find((b) => temperature < b.at) ?? HEAT_PREFIX[HEAT_PREFIX.length - 1]!
  const blend = metals.map((m) => m.ticker).join('·')
  return `${pick(band.words, rng)} ${blend} ${pick(FORMS, rng)}`
}

/** Stat roll: the tier sets the floor, affinities tilt which stat runs hottest. */
function rollStat(
  floor: number,
  affinityCount: number,
  totalMetals: number,
  rng: Rng,
): number {
  const affinityLift = totalMetals > 0 ? (affinityCount / totalMetals) * 22 : 0
  const spread = (100 - floor) * (0.35 + rng() * 0.65)
  return Math.round(clamp(floor + spread * 0.7 + affinityLift * rng(), 1, 100))
}

export interface ForgeResult {
  alloy: Alloy
  reading: ForgeReading
  /** True when the overclock gamble failed. The escrow is still intact. */
  cracked: boolean
}

export function forgeAlloy(input: ForgeInput, serial: number, rng: Rng): ForgeResult {
  const reading = readForge(input)
  const cracked = rng() < reading.crackRisk

  // A crack costs you the overclock, never the principal.
  const effectiveOdds = cracked
    ? rarityOdds(Math.min(reading.temperature, -0.2), 0, input.band)
    : reading.odds

  const rarityId = rollRarity(effectiveOdds, rng)
  const rarity = RARITIES[rarityId]!

  const share = 1 / input.metals.length
  const components: AlloyComponent[] = input.metals.map((metal) => ({
    metalId: metal.id,
    weight: share,
    lockedUsd: input.band * share,
    lockedAt: input.quotes[metal.id]?.price ?? metal.basePrice,
  }))

  const count = (affinity: Metal['affinity']) =>
    input.metals.filter((m) => m.affinity === affinity).length

  const total = input.metals.length
  const purity = rollStat(rarity.statFloor, count('purity'), total, rng)
  const resonance = rollStat(rarity.statFloor, count('resonance'), total, rng)
  const integrity = rollStat(rarity.statFloor, count('integrity'), total, rng)

  const yieldPerDay =
    baseYield(input.band) *
    rarity.yieldMult *
    (1 + purity / 200) *
    reading.coldBonus *
    (1 + count('yield') * 0.12) *
    (cracked ? 0.5 : 1)

  const alloy: Alloy = {
    id: `alloy_${serial}_${Math.floor(rng() * 1e9).toString(36)}`,
    name: nameAlloy(input.metals, reading.temperature, rng),
    serial,
    rarity: rarityId,
    components,
    purity,
    resonance,
    integrity,
    yieldPerDay: Math.round(yieldPerDay * 10) / 10,
    bandUsd: input.band,
    overclock: input.overclock,
    cracked,
    coldForged: reading.coldForged,
    forgedAt: Date.now(),
    slot: null,
    expeditionId: null,
  }

  return { alloy, reading, cracked }
}

/** Escrowed dollars at the prices the components were locked at. */
export const lockedValue = (alloy: Alloy): number =>
  alloy.components.reduce((sum, c) => sum + c.lockedUsd, 0)

/**
 * What melting returns today. Components are marked to the live price, then the
 * protocol keeps 10% — so the NFT's floor moves with the market, not with the
 * forge.
 */
export function redeemValue(alloy: Alloy, quotes: Record<string, Quote>): number {
  const marked = alloy.components.reduce((sum, c) => {
    const price = quotes[c.metalId]?.price ?? c.lockedAt
    return sum + c.lockedUsd * (price / c.lockedAt)
  }, 0)
  return marked * 0.9
}

export const MELT_RETURN_RATE = 0.9
