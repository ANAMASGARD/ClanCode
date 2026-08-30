# Clan Code Visualization Asset Catalog

Last verified: 2026-08-30

This catalog is the volatile inventory for the web control-plane visualization.
It records what is currently present under `public/`; it is not an execution,
authorization, or game-state source of truth.

## Ownership

```text
public/assets/   → Kenney 3D bytes used by the web visualization
public/fonts/    → Clash Display web HUD and branding fonts
public/audio/    → web HUD theme music and interaction sound effects
```

The assets belong to the Next.js web application. They must not be copied into
`clan-cli/`, loaded by CLI code, or used to infer repository, run, approval,
validation, branch, or pull-request state.

## Kenney kits

All four packs include a `License.txt` identifying the content as Creative
Commons Zero (CC0). The licenses allow personal, educational, and commercial
use. Crediting Kenney or `www.kenney.nl` is encouraged but not required.

| Pack | Repository path | Inventory observed | Intended visualization role |
|---|---|---|---|
| Fantasy Town Kit 2.0 | `public/assets/kenney_fantasy-town-kit_2.0/` | 167 GLBs in `Models/GLB format/`; 72 selected by the game catalog | Primary village construction set: walls, roofs, doors, stairs, trees, stalls, fountains, rocks, windmill, and watermill pieces. Map repositories, modules, or services to buildings only through domain state. |
| Nature Kit 2.1 | `public/assets/kenney_nature-kit/` | 329 GLBs in `Models/GLTF format/`; 121 selected by the game catalog | Island terrain and dressing: flat plot layers, river tiles, cliffs, round-tree canopy, shoreline rocks/stones, waterfalls, paths, and plants. Environment only — not product state. |
| Pirate Kit 2.1 | `public/assets/kenney_pirate-kit/` | 72 GLBs in `Models/GLB format/`; 37 selected by the game catalog | Coastal props retained in catalog for future harbor/build passes; not rendered in the current empty-plot scene. |
| Survival Kit 2.0 | `public/assets/kenney_survival-kit/` | 80 GLBs in `Models/GLB format/`; 26 selected by the game catalog | Work-site props: tents, workbenches, tools, campfires, resources, fences, and storage. These may visualize active task or agent work, but animations remain decorative. |
| Blocky Characters 2.0 | `public/assets/kenney_blocky-characters_20/` | 18 GLBs in `Models/GLB format/`; all 18 selected by the game catalog | Village inhabitants. Each model ships `static`, `idle`, `walk`, `sprint`, and further clips as node-transform animations (no skins). Characters are ambience only; they never encode run, approval, or agent state. |

### Common kit layout

```text
public/assets/kenney_<kit>/
├── License.txt
├── Overview.html             # present in some kits; human reference only
├── Models/
│   ├── OBJ format/           # .obj meshes and .mtl materials
│   ├── FBX format/           # only where the kit includes it
│   ├── GLB format/           # Fantasy, Pirate, and Survival runtime meshes
│   ├── GLTF format/          # Nature runtime GLBs
│   └── Textures/             # kit texture files where included
└── Previews/                 # thumbnails/reference images, not runtime meshes
```

The runtime scene uses GLBs exclusively through the typed catalog and
`kenneyGlbUrl()`. Do not load `Overview.html`, preview images, OBJ, or FBX files
as scene models when the verified GLB exists.

## Fonts

| File | Role | Status |
|---|---|---|
| `public/fonts/Clash_Bold.otf.ttf` | Candidate headings and HUD emphasis | Present but not wired; deployment/redistribution license not established |
| `public/fonts/Clash_Regular.otf.ttf` | Candidate body HUD copy | Present but not wired; deployment/redistribution license not established |

The double extension is part of the current filenames. Do not deploy or
redistribute these files until their license is verified. The game currently
uses legally safe system font fallbacks. Font choice cannot encode state or
permission.

## Audio

The audio directory is web HUD presentation state only.

| File | Observed format | Role |
|---|---|---|
| `public/audio/Clan Code - Main Theme.m4a` | M4A/ISO media audio | Main theme; loop while the web experience is active when playback is permitted |
| `public/audio/click-003.mp3` | MP3, 44.1 kHz, mono | Short click/select feedback for interactive HUD items |

Audio behavior contract:

1. The main theme is a loop, but browsers may block autoplay. Never force
   unmuted autoplay; begin after a user gesture or begin muted.
2. Users can mute and unmute the theme through an accessible HUD control.
3. A click/select interaction may play `click-003.mp3`. Failed playback must
   not fail the interaction or alter domain state.
4. Persisting the mute preference in browser storage is optional client
   convenience. It must never be sent as a run command or treated as approval.
5. Audio must not imply that a task succeeded, a tool was authorized, a test
   passed, or a PR exists.

## Web integration boundaries

```text
app/lib/visualization/kenney.ts  → typed public URLs for kit models/materials
app/lib/visualization/audio.ts   → typed audio URLs and client audio controller
app/game/                        → lazy-loaded R3F scene, prefabs, HUD, and state
```

The scene derives placement, labels, and status from presentation state and is
prepared to consume structured web/domain state. It remains usable when WebGL
or audio is unavailable.
The canvas, animations, and sound are projections; they are never the source of
truth for execution.

## Current status

- The asset folders are present under `public/assets/`.
- The font files are present under `public/fonts/`.
- The theme and click files are present under `public/audio/`.
- The live `/dashboard` canvas renders the Clash-style plot with instanced forest canopy, the Kenney stand-in village (Town Hall, 12 semantic buildings, 12 decorative accents, no interior walls), a single beach-facing rampart with a gate, a harbor with a pier and floating ships, and 10 Blocky Characters roaming at random. Still presentation-only.
- Villager characters come from the Blocky Characters kit and use its bundled `walk`/`idle` GLB animation clips. Character selection, count, and roaming bounds live in `app/game/state/villager-wander.ts`.
- Physics/edit-mode placement and persistent layout storage are not part of this foundation slice.
- The Kenney pack trees are intentionally tracked separately from the
  documentation/helper change because they contain a large number of binary
  files.
