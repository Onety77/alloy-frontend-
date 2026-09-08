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

/** Hammered pitting for anvil faces and pressed plates. */
export const HAMMERED = svg(
  `<filter id="h"><feTurbulence type="turbulence" baseFrequency="0.055" numOctaves="2" stitchTiles="stitch"/>` +
    `<feColorMatrix type="saturate" values="0"/>` +
    `<feComponentTransfer><feFuncA type="linear" slope="0.4"/></feComponentTransfer></filter>` +
    `<rect width="100%" height="100%" filter="url(#h)"/>`,
  240,
  240,
)

export const TEXTURE_VARS = {
  '--tx-grain': GRAIN,
  '--tx-iron': IRON,
  '--tx-scorch': SCORCH,
  '--tx-hammered': HAMMERED,
} as const
