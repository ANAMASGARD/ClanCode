# ClanCode Village Visual Redesign — Design Spec

**Date:** 2026-08-30  
**Scope:** 3D scene at `/dashboard/clan` only (no HUD redesign, no physics/persistence)  
**Branch target:** `feat/clancode-village-visual-redesign`

## Goal

Rebuild the clan island into a Clash-of-Clans-style presentation: flat grass plain, dense forest on three sides (north, east, south), west beach with harbor district, and a diamond-reading walled core with 12 semantic buildings plus decorative density — using CC0 Kenney assets from `public/assets/` only.

## Composition

- **West:** beach, harbor (two ships, rowboat, lighthouse, docks, palms, rocks), road to Approval Gate
- **Center:** world-axis-aligned castle wall ring (reads as diamond on isometric camera), Town Hall on stone plaza, semantic buildings inside
- **Outside walls:** 10–16 decorative houses, yards, guard posts, market clusters
- **North/East/South:** 120–180 instanced trees in depth bands
- **River:** north waterfall → bends → bridge → watermill → toward harbor

## Architecture (unchanged)

Presentation only — scene never authorizes tools or invents run state. No `clan-cli/` changes.

## Key technical changes

1. **Asset catalog:** `uniformScale`, `pivotMode` (`preserve-origin` | `ground-center` | `custom`), `district`, `instanceable`
2. **AssetModel:** honour pivot modes; clone materials
3. **Terrain:** irregular extruded grass plain, west sand, varied cliffs, bright water
4. **Layout data:** `tile.ts`, `walls.ts`, `semantic-layout.ts`, `decorative-layout.ts`, `roads.ts`, `harbor-layout.ts`
5. **Prefabs:** split per building; Town Hall rebuilt without stretched roofs
6. **Forest:** three-band instanced renderer
7. **Lighting/camera:** brighter day, softer vignette, island fills ~80% viewport

## Out of scope

HUD redesign, drag/physics, Neon persistence, task pipeline wiring.
