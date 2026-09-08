# FORGE — Metallic Alchemy

Front end for a forge game where the metals are real equities.

You escrow tokenised NVIDIA, Tesla, Apple, Meta, Palantir and AMD, melt two or
three of them together, and the alloy that comes out rolls its rarity against
live price action. A green tape genuinely makes better loot; a red one makes
cold-forged steel that yields more. What you pull out is an NFT with stock
locked inside it — melt it whenever you like and the underlying comes back at
90% of its live mark.

Then you play it: slot alloys in the smithy for daily shards, send them on
expeditions, raid rivals for shards they have not claimed, and climb a monthly
season ladder that settles in ETH.

**This repository is the front end only.** Every price, roll and balance is
simulated in the browser. There are no wallet SDKs, contract calls or network
requests — the seams where those belong are marked below.

---

## Running it

```sh
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production bundle into dist/
npm run preview    # serve the built bundle
npm run typecheck
```

Node 20+. No environment variables, no API keys, no backend.

---

## The screens

| Screen             | What it does                                                                 |
| ------------------ | ---------------------------------------------------------------------------- |
| **Forge**          | Load 2–3 metals, pick an investment band, push the overclock lever against a crack-risk curve, and pour. Shows live market temperature and the projected rarity odds before you commit. |
| **Inventory**      | Your alloy NFTs. Each one breaks down into the stock held behind it, marked against its lock price, and melts back at the live rate. |
| **Smithy**         | Bench slots that draw shards continuously, timed expeditions, and a raid board. Unclaimed shards are exposed to rivals. |
| **Market**         | Price board for every metal, a detail chart with a crosshair, the $ALLOY fee split, and the cold-forge window. |
| **Contracts**      | Guild orders with rarity, composition and purity clauses. Delivering consumes the ingot. |
| **Research**       | Four branches of permanent bench upgrades bought with shards. |
| **Hall of Ingots** | Season standings, the ETH purse and how it splits across the field. |

The Smithy is a seventh tab beyond the six in the original design reference:
slots, expeditions and raids are a third of the gameplay loop and did not fit
cleanly inside Inventory or Contracts.

---

## How the rarity engine works

`src/lib/rarity.ts` is the heart of it.

**Market temperature** is the volatility-normalised move of whatever is in the
crucible. Each metal's change is divided by its own sigma, so a twitchy metal
like Teslite does not drown out a calm one like Applium just for being
twitchier. It lands in −1 (frozen) to +1 (molten).

**Rarity odds** come from a single `luck` scalar built out of temperature,
overclock and the investment band. That scalar is raised to the power of the
tier index, so it barely moves the common tier while multiplying the top tiers.
That is what makes a green day actually produce better loot instead of just
nudging the average.

**Cold forging** is the other side of the trade. A red tape lowers the rarity
ceiling but multiplies daily shard yield, so a bad day is still worth working.

**Overclock** raises the ceiling along a super-linear crack-risk curve. A crack
costs you the overclock — never the escrowed principal.

Measured over 20,000 simulated pours at 40% overclock:

| | Singularity | Dross | Avg daily yield |
| --- | --- | --- | --- |
| Green day (+5%) | 2.08% | 25.8% | 30.2 |
| Red day (−5%)   | 0.04% | 63.5% | 32.2 |

---

## Design notes

**No CSS framework.** The ornate metal look is built from long gradient and
shadow stacks that read terribly as utility classes. `src/styles/tokens.css`
defines one palette — iron substrate, brass framing, ember heat, oracle
gain/loss — and a single light model that every bevel and lift derives from.

**Textures are procedural.** Grain, cast iron, scorch and hammered pitting are
SVG turbulence rasterised once and tiled as CSS backgrounds
(`src/lib/textures.ts`). No bitmaps, crisp at any DPI, a couple of kilobytes.
`scripts/generate-textures.mjs` can additionally produce large painterly
backdrop plates, but they are purely additive — the interface never depends on
a binary asset being present.

**Charts are faceted, not overlaid.** Six metal colours cannot all separate
under protanopia — blue and violet collapse — so the market board draws one
labelled sparkline per metal plus a single-series detail chart, rather than six
lines on one axis. Ingot colours stay true to the object (Applium is silver,
Palantirium is graphite); charts and text use brightened variants that clear a
3:1 contrast floor. See the note on `Metal.line` in `src/lib/types.ts`.

---

## Where the real integrations go

Everything below is deliberately isolated so it can be swapped without touching
the UI:

- **Price feed** — `src/state/marketSim.ts`. `stepQuotes()` is a mean-reverting
  random walk standing in for a Chainlink feed. Replace that one function and
  every consumer keeps working; the rarity engine already normalises against the
  same per-metal sigma.
- **Wallet & chain** — `wallet` in `src/state/store.ts`. `connect()` currently
  just flips a flag.
- **Escrow, minting and melting** — `craft()` and `melt()` in the same store.
  Melt maths lives in `redeemValue()` in `src/lib/rarity.ts`.
- **Ladder and rivals** — `src/state/content.ts` holds static fixtures for the
  season ladder, raid targets, contracts, expedition routes and the research
  tree.

State persists to `localStorage` under `forge-bench-v1`; quotes are deliberately
reseeded each load so the tape is never stale on return. `resetBench()` clears
everything.

---

## Layout

```
src/
  lib/        domain: metals, rarity engine, textures, formatting, colour
  state/      zustand store, market simulation, static content, selectors
  components/
    ui/       Panel, Button, Dial, Modal, Sparkline, PriceChart, Icon …
    game/     Ingot, AlloyIngot, AlloyCard, AlloyPicker
    layout/   AppShell, TopBar, BottomNav, Backdrop, ScreenHeader
  screens/    one directory per tab
  styles/     tokens, base, primitives
```
