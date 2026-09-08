import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import type { Alloy, Quote, ScreenId } from '@/lib/types'
import { activeMetals, isColdForgeWindow, metalById } from '@/lib/metals'
import {
  coldYieldBonus,
  forgeAlloy,
  rarityOdds,
  readForge,
  redeemValue,
  temperatureLabel,
  RARITIES,
  RARITY_ORDER,
  type ForgeReading,
  type InvestmentBand,
} from '@/lib/rarity'
import { clamp, mulberry32 } from '@/lib/rng'
import { ORACLE_PERIOD_MS, seedQuotes, stepQuotes } from './marketSim'
import {
  CONTRACTS,
  EXPEDITION_ROUTES,
  RESEARCH_NODES,
  RIVALS,
  researchCost,
  type Expedition,
} from './content'

export type LogTone = 'neutral' | 'good' | 'bad' | 'rare'

export interface LogEntry {
  id: string
  at: number
  text: string
  tone: LogTone
}

export interface Wallet {
  connected: boolean
  address: string
  alloyToken: number
  eth: number
  shards: number
  /** Raid energy. Regenerates slowly; spent to open a raid. */
  cinder: number
}

/** Everything research changes, resolved in one place. */
export interface Perks {
  slots: number
  purityFloorBonus: number
  crackReduction: number
  maxOverclock: number
  temperatureBonus: number
  coldYieldBonus: number
  meltReturn: number
  showRedeemDelta: boolean
  claimBonus: number
  expeditionBonus: number
  raidPower: number
  raidDefence: number
}

interface GameState {
  /* --- market ------------------------------------------------- */
  quotes: Record<string, Quote>
  coldWindow: boolean
  nextOracleAt: number
  tick: () => void

  /* --- forge bench -------------------------------------------- */
  selection: string[]
  band: InvestmentBand
  overclock: number
  toggleMetal: (id: string) => void
  clearSelection: () => void
  setBand: (band: InvestmentBand) => void
  setOverclock: (value: number) => void
  reading: () => ForgeReading
  craft: () => { alloy: Alloy; cracked: boolean } | null

  /* --- holdings ----------------------------------------------- */
  alloys: Alloy[]
  serial: number
  melt: (alloyId: string) => number | null

  /* --- wallet ------------------------------------------------- */
  wallet: Wallet
  connect: () => void

  /* --- smithy ------------------------------------------------- */
  unclaimed: number
  lastAccrual: number
  accrue: () => void
  slotAlloy: (alloyId: string) => boolean
  unslotAlloy: (alloyId: string) => void
  claim: () => number

  /* --- expeditions -------------------------------------------- */
  expeditions: Expedition[]
  dispatch: (routeId: string, alloyIds: string[]) => boolean
  collectExpedition: (expeditionId: string) => void

  /* --- raids -------------------------------------------------- */
  raided: Record<string, number>
  raid: (rivalId: string) => { won: boolean; taken: number } | null

  /* --- contracts ---------------------------------------------- */
  fulfilled: string[]
  fulfil: (contractId: string, alloyId: string) => boolean

  /* --- research ----------------------------------------------- */
  research: Record<string, number>
  buyResearch: (nodeId: string) => boolean
  perks: () => Perks

  /* --- shell -------------------------------------------------- */
  screen: ScreenId
  setScreen: (screen: ScreenId) => void
  log: LogEntry[]
  resetBench: () => void
}

const MAX_SELECTION = 3
const MAX_LOG = 40
const CINDER_CAP = 6

/** The sim's own RNG. Separate from forge rolls so one cannot bias the other. */
const marketRng = mulberry32(Date.now() & 0xffff)
const forgeRng = () => Math.random()

const initialWallet = (): Wallet => ({
  connected: false,
  address: '0x7f3a…c2e9',
  alloyToken: 1450,
  eth: 0.084,
  shards: 2600,
  cinder: CINDER_CAP,
})

const logEntry = (text: string, tone: LogTone): LogEntry => ({
  id: `l_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
  at: Date.now(),
  text,
  tone,
})

/**
 * Pure derivations.
 *
 * These must not be called inside a zustand selector: each returns a fresh
 * object, so subscribing to one would make every snapshot compare unequal and
 * spin React forever. Components read them through the memoised hooks in
 * `selectors.ts`; the store calls them directly inside actions.
 */
export function computePerks(research: Record<string, number>): Perks {
  const lv = (id: string) => research[id] ?? 0
  return {
    slots: 3 + lv('deeper_crucible'),
    purityFloorBonus: lv('refined_flux') * 3,
    crackReduction: lv('stabilisers') * 0.04,
    maxOverclock: 76 + lv('forced_draught') * 8,
    temperatureBonus: lv('heat_retention') * 0.05,
    coldYieldBonus: 1 + lv('cold_mastery') * 0.1,
    meltReturn: 0.9 + lv('favourable_terms') * 0.005,
    showRedeemDelta: lv('escrow_insight') > 0,
    claimBonus: lv('fee_rebate') * 0.04,
    expeditionBonus: lv('long_marches') * 0.12,
    raidPower: lv('raiding_party') * 6,
    raidDefence: lv('ward_stones') * 6,
  }
}

export function computeReading(
  selection: string[],
  quotes: Record<string, Quote>,
  band: InvestmentBand,
  overclock: number,
  coldWindow: boolean,
  perks: Perks,
): ForgeReading {
  const base = readForge({
    metals: selection.map(metalById),
    quotes,
    band,
    overclock,
    coldWindow,
  })

  // Heat Retention shifts the effective tape, so re-derive everything that
  // depends on temperature rather than only relabelling the gauge.
  const temperature = clamp(base.temperature + perks.temperatureBonus, -1, 1)
  const odds = rarityOdds(temperature, overclock, band)

  return {
    ...base,
    temperature,
    label: temperatureLabel(temperature),
    heat: (temperature + 1) / 2,
    odds,
    crackRisk: Math.max(0, base.crackRisk - perks.crackReduction),
    coldBonus: coldYieldBonus(temperature) * perks.coldYieldBonus,
  }
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      /* ---------------------------------------------------------- */
      quotes: seedQuotes(activeMetals(isColdForgeWindow())),
      coldWindow: isColdForgeWindow(),
      nextOracleAt: Date.now() + ORACLE_PERIOD_MS,

      tick: () => {
        const state = get()
        const metals = activeMetals(state.coldWindow)
        const now = Date.now()
        const pushed = now >= state.nextOracleAt

        set({
          quotes: stepQuotes(state.quotes, metals, marketRng, pushed ? 6 : 1),
          nextOracleAt: pushed ? now + ORACLE_PERIOD_MS : state.nextOracleAt,
        })

        // Cinder trickles back so raiding stays available without being free.
        if (pushed) {
          set((s) => ({
            wallet: { ...s.wallet, cinder: Math.min(CINDER_CAP, s.wallet.cinder + 1) },
          }))
        }

        get().accrue()
      },

      /* ---------------------------------------------------------- */
      selection: [],
      band: 25,
      overclock: 0,

      toggleMetal: (id) =>
        set((s) => {
          if (s.selection.includes(id)) {
            return { selection: s.selection.filter((m) => m !== id) }
          }
          if (s.selection.length >= MAX_SELECTION) return s
          return { selection: [...s.selection, id] }
        }),

      clearSelection: () => set({ selection: [] }),
      setBand: (band) => set({ band }),
      setOverclock: (value) =>
        set((s) => ({ overclock: clamp(Math.round(value), 0, s.perks().maxOverclock) })),

      reading: () =>
        computeReading(
          get().selection,
          get().quotes,
          get().band,
          get().overclock,
          get().coldWindow,
          computePerks(get().research),
        ),

      craft: () => {
        const s = get()
        if (s.selection.length < 2) return null

        const perks = s.perks()
        const metals = s.selection.map(metalById)
        const result = forgeAlloy(
          {
            metals,
            quotes: s.quotes,
            band: s.band,
            overclock: s.overclock,
            coldWindow: s.coldWindow,
          },
          s.serial + 1,
          forgeRng,
        )

        // Research nudges the finished ingot rather than the odds table, so the
        // displayed odds on the bench stay honest.
        const alloy: Alloy = {
          ...result.alloy,
          purity: clamp(result.alloy.purity + perks.purityFloorBonus, 1, 100),
          yieldPerDay: Math.round(result.alloy.yieldPerDay * perks.coldYieldBonus * 10) / 10,
          cracked: result.cracked && forgeRng() > perks.crackReduction * 2,
        }

        const rarity = RARITIES[alloy.rarity]!
        const tone: LogTone =
          RARITY_ORDER.indexOf(alloy.rarity) >= 3 ? 'rare' : alloy.cracked ? 'bad' : 'good'

        set({
          alloys: [alloy, ...s.alloys],
          serial: s.serial + 1,
          log: [
            logEntry(
              alloy.cracked
                ? `Crucible cracked. ${rarity.name} recovered, escrow intact.`
                : `Pulled ${rarity.name} — ${alloy.name}.`,
              tone,
            ),
            ...s.log,
          ].slice(0, MAX_LOG),
        })

        return { alloy, cracked: alloy.cracked }
      },

      /* ---------------------------------------------------------- */
      alloys: [],
      serial: 0,

      melt: (alloyId) => {
        const s = get()
        const alloy = s.alloys.find((a) => a.id === alloyId)
        if (!alloy || alloy.expeditionId) return null

        const gross = redeemValue(alloy, s.quotes)
        // redeemValue bakes in the base 90%; research recovers a little of the cut.
        const returned = (gross / 0.9) * s.perks().meltReturn

        set({
          alloys: s.alloys.filter((a) => a.id !== alloyId),
          wallet: { ...s.wallet, alloyToken: s.wallet.alloyToken + returned },
          log: [
            logEntry(`Melted ${alloy.name} for $${returned.toFixed(2)} of stock.`, 'neutral'),
            ...s.log,
          ].slice(0, MAX_LOG),
        })

        return returned
      },

      /* ---------------------------------------------------------- */
      wallet: initialWallet(),
      connect: () =>
        set((s) => ({
          wallet: { ...s.wallet, connected: true },
          log: [logEntry('Bench connected to Robinhood Chain.', 'good'), ...s.log].slice(0, MAX_LOG),
        })),

      /* ---------------------------------------------------------- */
      unclaimed: 0,
      lastAccrual: Date.now(),

      accrue: () => {
        const s = get()
        const now = Date.now()
        const elapsed = now - s.lastAccrual
        if (elapsed <= 0) return

        const perDay = s.alloys
          .filter((a) => a.slot !== null)
          .reduce((sum, a) => sum + a.yieldPerDay, 0)

        set({
          unclaimed: s.unclaimed + (perDay * elapsed) / 86_400_000,
          lastAccrual: now,
        })
      },

      slotAlloy: (alloyId) => {
        const s = get()
        const perks = s.perks()
        const used = new Set(s.alloys.filter((a) => a.slot !== null).map((a) => a.slot))
        let free = -1
        for (let i = 0; i < perks.slots; i++) {
          if (!used.has(i)) {
            free = i
            break
          }
        }
        if (free === -1) return false

        const target = s.alloys.find((a) => a.id === alloyId)
        if (!target || target.slot !== null || target.expeditionId) return false

        s.accrue()
        set((st) => ({
          alloys: st.alloys.map((a) => (a.id === alloyId ? { ...a, slot: free } : a)),
        }))
        return true
      },

      unslotAlloy: (alloyId) => {
        get().accrue()
        set((s) => ({
          alloys: s.alloys.map((a) => (a.id === alloyId ? { ...a, slot: null } : a)),
        }))
      },

      claim: () => {
        const s = get()
        s.accrue()
        const pending = get().unclaimed
        if (pending < 0.01) return 0

        const claimed = pending * (1 + s.perks().claimBonus)
        set((st) => ({
          unclaimed: 0,
          wallet: { ...st.wallet, shards: st.wallet.shards + claimed },
          log: [logEntry(`Claimed ${Math.floor(claimed)} shards.`, 'good'), ...st.log].slice(0, MAX_LOG),
        }))
        return claimed
      },

      /* ---------------------------------------------------------- */
      expeditions: [],

      dispatch: (routeId, alloyIds) => {
        const s = get()
        const route = EXPEDITION_ROUTES.find((r) => r.id === routeId)
        if (!route || alloyIds.length !== route.crewSize) return false

        const crew = s.alloys.filter((a) => alloyIds.includes(a.id))
        if (crew.length !== route.crewSize) return false
        if (crew.some((a) => a.expeditionId)) return false

        const avgResonance = crew.reduce((sum, a) => sum + a.resonance, 0) / crew.length
        const successChance = clamp(0.34 + (avgResonance - route.parResonance) / 110, 0.12, 0.96)

        const now = Date.now()
        const expedition: Expedition = {
          id: `x_${now.toString(36)}`,
          routeId,
          alloyIds,
          startedAt: now,
          endsAt: now + route.durationHours * 3_600_000,
          successChance,
        }

        set({
          expeditions: [...s.expeditions, expedition],
          alloys: s.alloys.map((a) =>
            alloyIds.includes(a.id) ? { ...a, expeditionId: expedition.id, slot: null } : a,
          ),
          log: [
            logEntry(`Crew away to ${route.name} — ${Math.round(successChance * 100)}% odds.`, 'neutral'),
            ...s.log,
          ].slice(0, MAX_LOG),
        })
        return true
      },

      collectExpedition: (expeditionId) => {
        const s = get()
        const expedition = s.expeditions.find((e) => e.id === expeditionId)
        if (!expedition || Date.now() < expedition.endsAt) return

        const route = EXPEDITION_ROUTES.find((r) => r.id === expedition.routeId)!
        const won = Math.random() < expedition.successChance
        const bonus = 1 + s.perks().expeditionBonus
        const shards = won ? route.rewardShards * bonus : route.rewardShards * 0.25
        const tokens = won ? route.rewardAlloyToken * bonus : 0

        set({
          expeditions: s.expeditions.filter((e) => e.id !== expeditionId),
          alloys: s.alloys.map((a) =>
            a.expeditionId === expeditionId ? { ...a, expeditionId: null } : a,
          ),
          wallet: {
            ...s.wallet,
            shards: s.wallet.shards + shards,
            alloyToken: s.wallet.alloyToken + tokens,
          },
          log: [
            logEntry(
              won
                ? `${route.name} paid out ${Math.round(shards)} shards.`
                : `${route.name} went badly. Salvaged ${Math.round(shards)} shards.`,
              won ? 'good' : 'bad',
            ),
            ...s.log,
          ].slice(0, MAX_LOG),
        })
      },

      /* ---------------------------------------------------------- */
      raided: {},

      raid: (rivalId) => {
        const s = get()
        const rival = RIVALS.find((r) => r.id === rivalId)
        if (!rival || s.wallet.cinder < rival.cost) return null
        if (s.raided[rivalId]) return null

        const perks = s.perks()
        const slotted = s.alloys.filter((a) => a.slot !== null)
        const attack =
          38 +
          perks.raidPower +
          (slotted.length
            ? slotted.reduce((sum, a) => sum + a.resonance, 0) / slotted.length / 2.4
            : 0)

        const won = Math.random() < clamp(attack / (attack + rival.defence), 0.08, 0.94)
        const taken = won ? Math.round(rival.exposed * 0.35) : 0

        set({
          wallet: {
            ...s.wallet,
            cinder: s.wallet.cinder - rival.cost,
            shards: s.wallet.shards + taken,
          },
          raided: { ...s.raided, [rivalId]: Date.now() },
          log: [
            logEntry(
              won
                ? `Took ${taken} shards off ${rival.handle}.`
                : `${rival.handle} held the wall. Nothing taken.`,
              won ? 'good' : 'bad',
            ),
            ...s.log,
          ].slice(0, MAX_LOG),
        })

        return { won, taken }
      },

      /* ---------------------------------------------------------- */
      fulfilled: [],

      fulfil: (contractId, alloyId) => {
        const s = get()
        const contract = CONTRACTS.find((c) => c.id === contractId)
        const alloy = s.alloys.find((a) => a.id === alloyId)
        if (!contract || !alloy || s.fulfilled.includes(contractId)) return false
        if (alloy.expeditionId) return false

        set({
          alloys: s.alloys.filter((a) => a.id !== alloyId),
          fulfilled: [...s.fulfilled, contractId],
          wallet: {
            ...s.wallet,
            alloyToken: s.wallet.alloyToken + contract.rewardAlloyToken,
            shards: s.wallet.shards + contract.rewardShards,
          },
          log: [
            logEntry(`Delivered ${contract.title} to the ${contract.issuer}.`, 'good'),
            ...s.log,
          ].slice(0, MAX_LOG),
        })
        return true
      },

      /* ---------------------------------------------------------- */
      research: {},

      buyResearch: (nodeId) => {
        const s = get()
        const node = RESEARCH_NODES.find((n) => n.id === nodeId)
        if (!node) return false

        const level = s.research[nodeId] ?? 0
        if (level >= node.maxLevel) return false
        if (node.requires.some((req) => (s.research[req] ?? 0) < 1)) return false

        const cost = researchCost(node, level)
        if (s.wallet.shards < cost) return false

        set({
          research: { ...s.research, [nodeId]: level + 1 },
          wallet: { ...s.wallet, shards: s.wallet.shards - cost },
          log: [logEntry(`Researched ${node.name} ${level + 1}.`, 'good'), ...s.log].slice(0, MAX_LOG),
        })
        return true
      },

      perks: () => computePerks(get().research),

      /* ---------------------------------------------------------- */
      screen: 'forge',
      setScreen: (screen) => set({ screen }),
      log: [],

      resetBench: () =>
        set({
          alloys: [],
          serial: 0,
          wallet: initialWallet(),
          research: {},
          expeditions: [],
          fulfilled: [],
          raided: {},
          unclaimed: 0,
          lastAccrual: Date.now(),
          selection: [],
          overclock: 0,
          band: 25,
          log: [logEntry('Bench cleared.', 'neutral')],
        }),
    }),
    {
      name: 'forge-bench-v1',
      storage: createJSONStorage(() => localStorage),
      // Quotes are reseeded on every load; persisting a stale tape would make
      // the market look frozen on return.
      partialize: (s) => ({
        alloys: s.alloys,
        serial: s.serial,
        wallet: s.wallet,
        research: s.research,
        expeditions: s.expeditions,
        fulfilled: s.fulfilled,
        raided: s.raided,
        unclaimed: s.unclaimed,
        lastAccrual: s.lastAccrual,
        band: s.band,
        log: s.log,
      }),
    },
  ),
)
