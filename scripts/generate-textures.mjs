#!/usr/bin/env node
/**
 * Optional atmospheric plates for the forge backdrop.
 *
 * The UI does not need these. Every frame, gauge and panel is drawn
 * procedurally from SVG turbulence in src/lib/textures.ts. These plates only
 * add large-scale painterly depth behind the interface — forge walls, banked
 * coals, scorched stone. If public/textures is empty the app falls back to the
 * procedural layers cleanly, because each plate is painted as an extra layer
 * above a base that already stands on its own.
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... node scripts/generate-textures.mjs
 *   OPENAI_API_KEY=sk-... node scripts/generate-textures.mjs forge-wall
 *
 * Never commit the key. Commit the generated PNGs so the app ships without it.
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'textures')

const STYLE =
  'Dark fantasy blacksmith forge, painterly game-UI background art, deep near-black ' +
  'charcoal and iron greys with restrained molten amber accents, heavy chiaroscuro, ' +
  'photographic grain, no text, no letters, no logos, no characters, no user interface ' +
  'elements, no borders or frames, edge-to-edge texture only, muted and desaturated so ' +
  'foreground UI stays legible on top'

const PLATES = [
  {
    name: 'forge-wall',
    size: '1536x1024',
    prompt:
      `${STYLE}. A vast soot-blackened stone and riveted iron forge wall seen head on, ` +
      'flat even lighting, subtle vertical seams and old rivet lines, very low contrast, ' +
      'almost entirely dark with only faint warm rim light at the far edges.',
  },
  {
    name: 'coal-bed',
    size: '1536x1024',
    prompt:
      `${STYLE}. A wide bed of banked coals seen from above, mostly dark ash grey with ` +
      'veins of dull orange heat glowing through the cracks, soft focus, heavily ' +
      'vignetted into blackness at all four edges.',
  },
  {
    name: 'anvil-stone',
    size: '1024x1024',
    prompt:
      `${STYLE}. Close top-down macro of a pitted dark iron anvil face, hammer marks, ` +
      'fine scratches and cold grey metal, seamless flat lighting, no highlights blowing out.',
  },
  {
    name: 'parchment',
    size: '1024x1024',
    prompt:
      'Aged dark parchment texture for a game UI panel, deep umber and near-black, ' +
      'burnt and stained edges, fibrous grain, flat even lighting, no text, no writing, ' +
      'no illustrations, no borders, seamless edge-to-edge texture only.',
  },
]

async function generate(plate, key) {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt: plate.prompt,
      size: plate.size,
      quality: 'high',
      n: 1,
    }),
  })

  if (!res.ok) {
    throw new Error(`${plate.name}: ${res.status} ${await res.text()}`)
  }

  const json = await res.json()
  const b64 = json?.data?.[0]?.b64_json
  if (!b64) throw new Error(`${plate.name}: response carried no image data`)

  const file = resolve(OUT, `${plate.name}.png`)
  await writeFile(file, Buffer.from(b64, 'base64'))
  const kb = Math.round(Buffer.from(b64, 'base64').length / 1024)
  console.log(`  ✓ ${plate.name}.png  (${kb} KB)`)
}

const key = process.env.OPENAI_API_KEY
if (!key) {
  console.error('OPENAI_API_KEY is not set.\n\n  OPENAI_API_KEY=sk-... node scripts/generate-textures.mjs\n')
  process.exit(1)
}

const only = process.argv.slice(2)
const queue = only.length ? PLATES.filter((p) => only.includes(p.name)) : PLATES

if (!queue.length) {
  console.error(`No plate matched. Available: ${PLATES.map((p) => p.name).join(', ')}`)
  process.exit(1)
}

await mkdir(OUT, { recursive: true })
console.log(`Generating ${queue.length} plate(s) into public/textures …`)

let failed = 0
for (const plate of queue) {
  try {
    await generate(plate, key)
  } catch (err) {
    failed++
    console.error(`  ✗ ${err.message}`)
  }
}

console.log(
  failed
    ? `\nDone with ${failed} failure(s). The app still runs — plates are optional.`
    : '\nDone. Commit the PNGs; do not commit the key.',
)
