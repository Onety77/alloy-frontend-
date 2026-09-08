# Optional atmospheric plates

This directory is **intentionally empty** in a fresh checkout.

The interface draws all of its own texture procedurally from SVG turbulence
(`src/lib/textures.ts`) — grain, cast iron, scorch and hammered pitting. That
is what gives panels and frames their surface, and it needs no binary assets.

The files below are purely additive painterly depth for the backdrop. When
present they are layered *above* the procedural base; when absent nothing
breaks and the backdrop still reads correctly.

| file              | role                                    |
| ----------------- | --------------------------------------- |
| `forge-wall.png`  | far wall behind the whole interface     |
| `coal-bed.png`    | banked coals under the crucible         |
| `anvil-stone.png` | pitted iron for pressed panel faces     |
| `parchment.png`   | aged stock for contracts and research    |

Generate them with:

```sh
OPENAI_API_KEY=sk-... node scripts/generate-textures.mjs
```

Commit the resulting PNGs. Never commit the key.
