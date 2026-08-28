# Clan Code Visualization Asset Catalog

Last verified: 2026-08-28

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
| Fantasy Town Kit 2.0 | `public/assets/kenney_fantasy-town-kit_2.0/` | 167 OBJ files and 167 matching MTL files; the included `Overview.html` reports 167 objects and 0 animations | Primary village construction set: walls, roofs, doors, stairs, trees, stalls, fountains, rocks, windmill, and watermill pieces. Map repositories, modules, or services to buildings only through domain state. |
| Nature Kit 2.1 | `public/assets/kenney_nature-kit/` | 329 OBJ files, 329 matching MTL files, and 329 FBX files; no `Overview.html` was present in the current copy | Island dressing: trees, pines, palms, rocks, stones, statues, stumps, and tents. It represents environment and atmosphere, not product state. |
| Pirate Kit 2.1 | `public/assets/kenney_pirate-kit/` | 72 OBJ files and 72 matching MTL files; the included `Overview.html` reports 72 objects and 3 animations | Coastal and delivery landmarks: ships, docks, towers, castle pieces, flags, crates, cannons, and chests. A ship, chest, or flag may visualize delivery/PR state only when backed by a real artifact. |
| Survival Kit 2.0 | `public/assets/kenney_survival-kit/` | 80 OBJ files and 80 matching MTL files; the included `Overview.html` reports 80 objects and 3 animations | Work-site props: tents, workbenches, tools, campfires, resources, fences, and storage. These may visualize active task or agent work, but animations remain decorative. |

### Common kit layout

```text
public/assets/kenney_<kit>/
├── License.txt
├── Overview.html             # present in some kits; human reference only
├── Models/
│   ├── OBJ format/           # .obj meshes and .mtl materials
│   ├── FBX format/           # only where the kit includes it
│   └── Textures/             # kit texture files where included
└── Previews/                 # thumbnails/reference images, not runtime meshes
```

The repository currently contains OBJ/MTL assets rather than GLB/GLTF assets.
Use the OBJ or FBX format supported by the eventual loader. Do not load
`Overview.html` or preview images as scene models. Preserve relative material
and texture paths when a loader needs them.

## Fonts

| File | Role | Status |
|---|---|---|
| `public/fonts/Clash_Bold.otf.ttf` | Headings, labels, and strong HUD emphasis | Present; OpenType font data; not wired into `app/layout.tsx` yet |
| `public/fonts/Clash_Regular.otf.ttf` | Body HUD copy and general interface text | Present; OpenType font data; not wired into `app/layout.tsx` yet |

The double extension is part of the current filenames. Keep the files in
`public/fonts/` and reference them with stable `/fonts/...` URLs if a local
font-face or `next/font/local` integration is added. Do not use the font choice
to encode state or permission.

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

## Planned web integration boundaries

```text
app/lib/visualization/kenney.ts  → typed public URLs for kit models/materials
app/lib/visualization/audio.ts   → typed audio URLs and client audio controller
future client 3D module          → lazy-loaded R3F Canvas and scene composition
future HUD                       → mute control and click/select feedback
```

The future scene should derive placement, labels, and status from structured
web/domain state. It should remain usable when WebGL or audio is unavailable.
The canvas, animations, and sound are projections; they are never the source of
truth for execution.

## Current status

- The asset folders are present under `public/assets/`.
- The font files are present under `public/fonts/`.
- The theme and click files are present under `public/audio/`.
- No village scene, model loader, physics world, or audio controller has been
  wired into the Next.js app yet.
- The Kenney pack trees are intentionally tracked separately from the
  documentation/helper change because they contain a large number of binary
  files.
