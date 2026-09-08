/**
 * Procedural textures.
 *
 * Every surface in the forge is built from SVG turbulence rasterised once by
 * the browser and tiled as a CSS background. This beats shipping bitmaps for
 * UI chrome: the grain stays crisp at any DPI, costs a couple of kilobytes,
 * and can be recoloured from tokens instead of regenerated.
 *
 * Optional high-resolution atmospheric plates (forge walls, scorch) can be
 * dropped into /public/textures — see scripts/generate-textures.mjs. When a
 * plate is absent the procedural layer below stands in on its own, so the app
 * never depends on a binary asset being present.
 */

const svg = (body: string, w: number, h: number) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`,
  )}")`

/** Fine sensor-like grain. Sits over everything at low opacity. */
export const GRAIN = svg(
  `<filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch"/>` +
    `<feColorMatrix type="saturate" values="0"/></filter>` +
    `<rect width="100%" height="100%" filter="url(#g)" opacity="0.5"/>`,
  180,
  180,
)

/** Coarse, stretched noise reading as brushed/cast iron. */
export const IRON = svg(
  `<filter id="i"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.5" numOctaves="3" stitchTiles="stitch"/>` +
    `<feColorMatrix type="saturate" values="0"/>` +
    `<feComponentTransfer><feFuncA type="linear" slope="0.55"/></feComponentTransfer></filter>` +
    `<rect width="100%" height="100%" filter="url(#i)"/>`,
  260,
  260,
)

/** Big soft blotches — soot, scorch, uneven casting. */
export const SCORCH = svg(
  `<filter id="s"><feTurbulence type="fractalNoise" baseFrequency="0.008" numOctaves="5" stitchTiles="stitch"/>` +
    `<feColorMatrix type="saturate" values="0"/>` +
    `<feComponentTransfer><feFuncA type="gamma" exponent="2.4" amplitude="1.2"/></feComponentTransfer></filter>` +
    `<rect width="100%" height="100%" filter="url(#s)"/>`,
  700,
  700,
)

/**
 * Gentle large-scale variation, used as a *mask* on light layers so their
 * falloff is uneven without ever becoming a visible grey haze.
 */
export const HAZE = svg(
  `<filter id="z"><feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves="3" stitchTiles="stitch"/>` +
    `<feColorMatrix type="saturate" values="0"/>` +
    `<feComponentTransfer><feFuncA type="linear" slope="0.34" intercept="0.62"/></feComponentTransfer></filter>` +
    `<rect width="100%" height="100%" filter="url(#z)"/>`,
  600,
  600,
)

/** Hammered pitting for anvil faces and pressed plates. */
export const HAMMERED = svg(
  `<filter id="h"><feTurbulence type="turbulence" baseFrequency="0.055" numOctaves="2" stitchTiles="stitch"/>` +
    `<feColorMatrix type="saturate" values="0"/>` +
    `<feComponentTransfer><feFuncA type="linear" slope="0.4"/></feComponentTransfer></filter>` +
    `<rect width="100%" height="100%" filter="url(#h)"/>`,
  240,
  240,
)


/* ------------------------------------------------------------------ *
 * Architecture.
 *
 * The backdrop is a room, not a wash. These two tiles build its far
 * wall: coursed ashlar with real mortar joints, and the riveted iron
 * columns that break it up at intervals. Both are deterministic so the
 * seam lines up when tiled.
 * ------------------------------------------------------------------ */

/** Tiny deterministic LCG — block shading must be stable across reloads. */
function lcg(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
}

function buildMasonry(): string {
  const W = 480
  const H = 288
  const BW = 120
  const BH = 72
  const JOINT = 5
  const rand = lcg(0x5ea51)

  let blocks = ''
  const rows = H / BH
  for (let r = 0; r < rows; r++) {
    // Alternate courses are offset by half a block, the way real ashlar runs.
    const offset = (r % 2) * (BW / 2)
    for (let c = -1; c <= W / BW; c++) {
      const x = c * BW + offset
      const y = r * BH
      // Each stone is cut from a slightly different piece of rock.
      const v = 10 + Math.round(rand() * 9)
      const warm = rand() > 0.7 ? 2 : 0
      const fill = `rgb(${v + warm} ${v} ${v + 4})`
      blocks +=
        `<rect x="${x}" y="${y}" width="${BW - JOINT}" height="${BH - JOINT}" rx="1.5" fill="${fill}"/>`
      // A lit top edge and a shadowed foot give each course relief.
      blocks += `<rect x="${x}" y="${y}" width="${BW - JOINT}" height="1" fill="rgb(255 236 200 / 0.035)"/>`
      blocks +=
        `<rect x="${x}" y="${y + BH - JOINT - 1}" width="${BW - JOINT}" height="1" fill="rgb(0 0 0 / 0.5)"/>`
    }
  }

  // The mortar bed sits behind everything and shows through the joints.
  return svg(`<rect width="${W}" height="${H}" fill="#0b0b0f"/>${blocks}`, W, H)
}

function buildColumn(): string {
  const W = 520
  const H = 160
  const CW = 42

  let rivets = ''
  for (let y = 12; y < H; y += 34) {
    for (const x of [9, CW - 9]) {
      rivets +=
        `<circle cx="${x}" cy="${y}" r="3" fill="#202028"/>` +
        `<circle cx="${x - 0.7}" cy="${y - 0.8}" r="1.9" fill="#2e2e38"/>` +
        `<circle cx="${x + 0.6}" cy="${y + 0.9}" r="1.5" fill="rgb(0 0 0 / 0.55)"/>`
    }
  }

  return svg(
    `<rect width="${CW}" height="${H}" fill="#121218"/>` +
      // Left edge catches the key light; right edge falls away.
      `<rect x="0" y="0" width="2" height="${H}" fill="rgb(255 236 200 / 0.09)"/>` +
      `<rect x="${CW - 3}" y="0" width="3" height="${H}" fill="rgb(0 0 0 / 0.6)"/>` +
      rivets,
    W,
    H,
  )
}

export const MASONRY = buildMasonry()
export const COLUMN = buildColumn()

export const TEXTURE_VARS = {
  '--tx-grain': GRAIN,
  '--tx-iron': IRON,
  '--tx-scorch': SCORCH,
  '--tx-hammered': HAMMERED,
  '--tx-haze': HAZE,
  '--tx-masonry': MASONRY,
  '--tx-column': COLUMN,
} as const
