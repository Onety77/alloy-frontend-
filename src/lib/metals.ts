import type { Metal } from './types'

/**
 * The six equities are the weekday forge. Prices here are the opening marks
 * from the design reference, not live quotes — the market simulator walks them
 * from these anchors, and a real Chainlink feed would replace that walk
 * wholesale without any other file needing to change.
 */
export const EQUITY_METALS: Metal[] = [
  {
    id: 'nvd',
    name: 'NVidium',
    ticker: 'NVD',
    underlying: 'NVDA',
    kind: 'equity',
    hue: '#3fae6a',
    sheen: '#9df5bb',
    trait: 'Runs hot under load. Sharpens an alloy’s reach on expeditions.',
    affinity: 'resonance',
    basePrice: 142.35,
    volatility: 0.031,
  },
  {
    id: 'tes',
    name: 'Teslite',
    ticker: 'TES',
    underlying: 'TSLA',
    kind: 'equity',
    hue: '#c8392f',
    sheen: '#ff8e7d',
    trait: 'Violently reactive. Swings the roll hard in both directions.',
    affinity: 'yield',
    basePrice: 98.2,
    volatility: 0.046,
  },
  {
    id: 'apl',
    name: 'Applium',
    ticker: 'APL',
    underlying: 'AAPL',
    kind: 'equity',
    hue: '#b9c2cc',
    sheen: '#f4f8fb',
    trait: 'Refines cleanly. Raises the purity floor of any melt.',
    affinity: 'purity',
    basePrice: 76.4,
    volatility: 0.019,
  },
  {
    id: 'mtc',
    name: 'Metacite',
    ticker: 'MTC',
    underlying: 'META',
    kind: 'equity',
    hue: '#3f6fd0',
    sheen: '#8fb8ff',
    trait: 'Dense and inward-facing. Hardens an ingot against raids.',
    affinity: 'integrity',
    basePrice: 124.75,
    volatility: 0.028,
  },
  {
    id: 'plt',
    name: 'Palantirium',
    ticker: 'PLT',
    underlying: 'PLTR',
    kind: 'equity',
    hue: '#5c5f6b',
    sheen: '#b7bcc9',
    trait: 'Sees further than it should. Bends odds toward the rare tiers.',
    affinity: 'resonance',
    basePrice: 63.1,
    volatility: 0.052,
  },
  {
    id: 'amd',
    name: 'Amdium',
    ticker: 'AMD',
    underlying: 'AMD',
    kind: 'equity',
    hue: '#d8541c',
    sheen: '#ffa877',
    trait: 'Cheap to melt, generous to hold. Fattens the daily shard draw.',
    affinity: 'yield',
    basePrice: 111.6,
    volatility: 0.038,
  },
]

/**
 * When the equity feeds close for the weekend the cold forge opens on crypto
 * instead, so the loop never stalls between Friday and Monday.
 */
export const CRYPTO_METALS: Metal[] = [
  {
    id: 'btr',
    name: 'Bitronite',
    ticker: 'BTR',
    underlying: 'BTC',
    kind: 'crypto',
    hue: '#c98a2b',
    sheen: '#ffd591',
    trait: 'The heavy anchor of the cold forge. Slow, stubborn, valuable.',
    affinity: 'integrity',
    basePrice: 412.8,
    volatility: 0.055,
  },
  {
    id: 'etr',
    name: 'Etherite',
    ticker: 'ETR',
    underlying: 'ETH',
    kind: 'crypto',
    hue: '#7b6bd6',
    sheen: '#c3b6ff',
    trait: 'Settles the season purse. Alloys carrying it pay out cleaner.',
    affinity: 'yield',
    basePrice: 233.4,
    volatility: 0.061,
  },
  {
    id: 'sol',
    name: 'Solarium',
    ticker: 'SOL',
    underlying: 'SOL',
    kind: 'crypto',
    hue: '#27b3a0',
    sheen: '#8ff2e4',
    trait: 'Quick to melt and quicker to cool. Short, sharp yields.',
    affinity: 'resonance',
    basePrice: 88.15,
    volatility: 0.079,
  },
  {
    id: 'chl',
    name: 'Chainlite',
    ticker: 'CHL',
    underlying: 'LINK',
    kind: 'crypto',
    hue: '#3d7ad6',
    sheen: '#9dc4ff',
    trait: 'Carries the oracle’s own signal. Tightens every roll it touches.',
    affinity: 'purity',
    basePrice: 57.9,
    volatility: 0.058,
  },
  {
    id: 'pon',
    name: 'Ponsteel',
    ticker: 'PON',
    underlying: 'PONS',
    kind: 'crypto',
    hue: '#b8934f',
    sheen: '#f2dda8',
    trait: 'Native to the chain beneath the forge. Rare, and it knows it.',
    affinity: 'resonance',
    basePrice: 19.44,
    volatility: 0.094,
  },
]

export const ALL_METALS: Metal[] = [...EQUITY_METALS, ...CRYPTO_METALS]

const BY_ID = new Map(ALL_METALS.map((m) => [m.id, m]))

export const metalById = (id: string): Metal => {
  const metal = BY_ID.get(id)
  if (!metal) throw new Error(`Unknown metal: ${id}`)
  return metal
}

/**
 * Equity feeds are closed on weekends, which is exactly when the cold forge
 * takes over. Kept as a pure function of a date so the UI can preview either
 * mode without waiting for Saturday.
 */
export const isColdForgeWindow = (now: Date = new Date()): boolean => {
  const day = now.getUTCDay()
  return day === 0 || day === 6
}

export const activeMetals = (coldWindow: boolean): Metal[] =>
  coldWindow ? CRYPTO_METALS : EQUITY_METALS
