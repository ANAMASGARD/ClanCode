"use client";

import { AssetModel } from "@/app/game/scene/AssetModel";

/**
 * Kenney Castle Kit sample (`public/assets/kenney_castle-kit/Sample.png`).
 * Pieces are 1-unit modules: one cell per wall or tower, never both.
 */
const CELL = 1;
const SQ = 1.01;
const HEX = 1.31;
/** Default wall runs north–south; π/2 makes an east–west curtain. */
const EW = Math.PI / 2;

function cell(x: number, z: number, y = 0): [number, number, number] {
  return [x * CELL, y, z * CELL];
}

function Curtain({
  x,
  z,
  rotation = 0,
}: {
  x: number;
  z: number;
  rotation?: number;
}) {
  return <AssetModel assetKey="castle.wall" position={cell(x, z)} rotation={[0, rotation, 0]} />;
}

/** Three-storey square tower with the kit's steep blue pyramid roof. */
function TallKeep({
  x,
  z,
  windows = false,
  banner = false,
}: {
  x: number;
  z: number;
  windows?: boolean;
  banner?: boolean;
}) {
  return (
    <group position={cell(x, z)}>
      <AssetModel assetKey="castle.towerSquareBase" />
      <AssetModel
        assetKey={windows ? "castle.towerSquareMidWindows" : "castle.towerSquareMid"}
        position={[0, SQ, 0]}
      />
      <AssetModel assetKey="castle.towerSquareMid" position={[0, SQ * 2, 0]} />
      <AssetModel assetKey="castle.towerSquareTopRoofHigh" position={[0, SQ * 3, 0]} />
      <AssetModel assetKey="castle.flagPennant" position={[0, SQ * 3 + 1.22, 0]} scale={0.8} />
      {banner ? (
        <AssetModel
          assetKey="castle.flagBanner"
          position={[0, SQ * 1.15, 0.52]}
          rotation={[0, -EW, 0]}
        />
      ) : null}
    </group>
  );
}

function WoodLookout({ x, z }: { x: number; z: number }) {
  return (
    <group position={cell(x, z)}>
      <AssetModel assetKey="castle.towerSquareBase" />
      <AssetModel assetKey="castle.towerSquareMidOpen" position={[0, SQ, 0]} />
      <AssetModel assetKey="castle.towerHexagonTopWood" position={[0, SQ * 2, 0]} />
      <AssetModel assetKey="castle.flagWide" position={[0, SQ * 2 + 0.55, 0.12]} scale={0.85} />
    </group>
  );
}

function RoundKeep({ x, z }: { x: number; z: number }) {
  return (
    <group position={cell(x, z)}>
      <AssetModel assetKey="castle.towerHexagonBase" />
      <AssetModel assetKey="castle.towerHexagonRoof" position={[0, HEX, 0]} />
    </group>
  );
}

/**
 * L-shaped courtyard keep traced from the Castle Kit sample:
 * connected curtains, gatehouse with two round turrets + drawbridge,
 * tall blue-roof squares, inner gabled keep, siege and trees off the walls.
 */
export function TownHall() {
  return (
    <group>
      {/* North curtain */}
      <TallKeep x={-3} z={-3} banner />
      <Curtain x={-2} z={-3} rotation={EW} />
      <Curtain x={-1} z={-3} rotation={EW} />
      <Curtain x={0} z={-3} rotation={EW} />
      <Curtain x={1} z={-3} rotation={EW} />
      <TallKeep x={2} z={-3} windows />

      {/* West curtain */}
      <Curtain x={-3} z={-2} />
      <Curtain x={-3} z={-1} />
      <Curtain x={-3} z={0} />
      <Curtain x={-3} z={1} />
      <TallKeep x={-3} z={2} />

      {/* East curtain of the bailey */}
      <Curtain x={2} z={-2} />
      <Curtain x={2} z={-1} />
      <Curtain x={2} z={0} />
      <Curtain x={2} z={1} />

      {/* East wing */}
      <Curtain x={3} z={-1} rotation={EW} />
      <WoodLookout x={4} z={-1} />

      {/* South gatehouse — round turrets flank the arch; no wall on those cells */}
      <Curtain x={-2} z={2} rotation={EW} />
      <AssetModel
        assetKey="castle.wallCornerHalfTower"
        position={cell(-1, 2)}
        rotation={[0, -EW, 0]}
      />
      <AssetModel assetKey="castle.wallDoorway" position={cell(0, 2)} rotation={[0, EW, 0]} />
      <AssetModel assetKey="castle.metalGate" position={[0, 0.02, 2.12]} rotation={[0, EW, 0]} />
      <AssetModel assetKey="castle.gate" position={[0, 0.02, 2.22]} rotation={[0, EW, 0]} />
      <AssetModel assetKey="castle.bridgeDraw" position={[0, 0.02, 2.55]} rotation={[0, EW, 0]} />
      <AssetModel
        assetKey="castle.flagBannerShort"
        position={[-0.46, 0.52, 2.5]}
        rotation={[0, -EW, 0]}
      />
      <AssetModel
        assetKey="castle.flagBannerShort"
        position={[0.46, 0.52, 2.5]}
        rotation={[0, -EW, 0]}
      />
      <AssetModel assetKey="castle.wallCornerHalfTower" position={cell(1, 2)} />
      <AssetModel assetKey="castle.flagPole" position={[0.85, 0, 3.15]} scale={0.9} />

      {/* Inner courtyard */}
      <AssetModel assetKey="castle.towerSlantRoof" position={cell(0, -1)} />
      <AssetModel assetKey="castle.door" position={[0.02, 0, -0.48]} />
      <RoundKeep x={1} z={0} />
      <AssetModel
        assetKey="castle.wallNarrowStairs"
        position={cell(-2, 0)}
        rotation={[0, EW, 0]}
      />
      <AssetModel
        assetKey="castle.stairsStone"
        position={[-0.35, 0, 1.15]}
        rotation={[0, Math.PI, 0]}
      />
      <AssetModel assetKey="castle.siegeRam" position={[0.15, 0, 0.85]} rotation={[0, EW, 0]} />

      {/* Siege yard — 2–4 units off the curtains */}
      <AssetModel assetKey="castle.catapult" position={[6.2, 0, 0.2]} rotation={[0, -EW, 0]} />
      <AssetModel assetKey="castle.siegeTower" position={[6.4, 0, 2.4]} rotation={[0, -EW, 0]} />
      <AssetModel assetKey="castle.ballista" position={[2.6, 0, 5.1]} rotation={[0, Math.PI, 0]} />

      {/* Trees, rocks, debris grounding the corners */}
      <AssetModel assetKey="castle.treeLarge" position={[-4.15, 0, -3.85]} />
      <AssetModel assetKey="castle.treeSmall" position={[-3.35, 0, -4.2]} />
      <AssetModel assetKey="castle.treeLarge" position={[2.85, 0, -4.05]} />
      <AssetModel assetKey="castle.treeSmall" position={[3.55, 0, -3.35]} />
      <AssetModel assetKey="castle.treeLarge" position={[-4.05, 0, 3.15]} />
      <AssetModel assetKey="castle.treeSmall" position={[-3.25, 0, 3.65]} />
      <AssetModel assetKey="castle.treeSmall" position={[1.85, 0, 3.45]} />
      <AssetModel assetKey="castle.treeSmall" position={[4.85, 0, -2.15]} />
      <AssetModel assetKey="castle.rocksLarge" position={[-3.9, 0, -1.1]} scale={0.75} />
      <AssetModel assetKey="castle.rocksSmall" position={[2.85, 0, 1.65]} scale={0.85} />
      <AssetModel assetKey="castle.rocksSmall" position={[-1.65, 0, 3.35]} />
      <AssetModel assetKey="castle.treeLog" position={[-4.6, 0, 0.4]} rotation={[0, 0.4, 0]} />
      <AssetModel assetKey="castle.wallHalf" position={[-4.35, 0, 1.35]} rotation={[0, 0.55, 0]} />

      <pointLight color="#ffe1b0" intensity={7} distance={14} position={[0, 3.4, 0]} />
    </group>
  );
}
