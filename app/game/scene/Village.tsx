"use client";

import type { SemanticBuilding, SemanticBuildingId } from "@/app/game/state/default-layout";
import { DEFAULT_CLAN_LAYOUT } from "@/app/game/state/default-layout";
import { DECORATIVE_PLACEMENTS } from "@/app/game/state/decorative-layout";
import { layoutWorldPosition, ROAD_TILES } from "@/app/game/state/roads";
import { tileToWorld } from "@/app/game/state/tile";
import {
  WALL_GATE,
  WALL_RING,
  WALL_TOWERS,
  wallWorldPosition,
} from "@/app/game/state/walls";
import { DECORATIVE_PREFABS, getSemanticPrefab } from "@/app/game/prefabs/registry";
import { BuildingMarker } from "./BuildingMarker";
import { AssetModel } from "./AssetModel";

type VillageProps = {
  selectedId: SemanticBuildingId | null;
  onSelect: (building: SemanticBuilding) => void;
  reducedMotion: boolean;
};

export function Village({ selectedId, onSelect, reducedMotion }: VillageProps) {
  return (
    <group>
      <WallRing />
      <RoadNetwork />
      <PlazaDressing />
      {DEFAULT_CLAN_LAYOUT.map((building) => {
        const prefab = getSemanticPrefab(building.id);
        const Component = prefab.component;
        return (
          <group key={building.id} position={building.position}>
            <BuildingMarker
              building={building}
              selected={selectedId === building.id}
              onSelect={onSelect}
              radius={prefab.selectionRadius}
            >
              <Component reducedMotion={reducedMotion} />
            </BuildingMarker>
          </group>
        );
      })}
      {DECORATIVE_PLACEMENTS.map((placement) => {
        const Component = DECORATIVE_PREFABS[placement.prefab];
        const [x, , z] = tileToWorld(placement.tileX, placement.tileZ);
        return (
          <group
            key={placement.id}
            position={[x, 0.94, z]}
            rotation={[0, placement.rotation ?? 0, 0]}
          >
            <Component />
          </group>
        );
      })}
    </group>
  );
}

function WallRing() {
  return (
    <group>
      {WALL_RING.map((segment) => {
        const [x, , z] = wallWorldPosition(segment);
        return (
          <AssetModel
            key={segment.id}
            assetKey={segment.assetKey}
            position={[x, 0.94, z]}
            rotation={[0, segment.rotation, 0]}
          />
        );
      })}
      <AssetModel
        assetKey={WALL_GATE.assetKey}
        position={wallWorldPosition(WALL_GATE)}
        rotation={[0, WALL_GATE.rotation, 0]}
      />
      {WALL_TOWERS.map((tower) => {
        const [x, , z] = wallWorldPosition(tower);
        return (
          <AssetModel
            key={tower.id}
            assetKey={tower.assetKey}
            position={[x, 0.94, z]}
            rotation={[0, tower.rotation, 0]}
          />
        );
      })}
    </group>
  );
}

function RoadNetwork() {
  return (
    <group>
      {ROAD_TILES.map((tile) => {
        const position = layoutWorldPosition(tile.tileX, tile.tileZ);
        return (
          <AssetModel
            key={tile.id}
            assetKey={tile.assetKey}
            position={position}
            rotation={[0, tile.rotation, 0]}
            scale={tile.assetKey.startsWith("village.") ? 1 : 0.42}
          />
        );
      })}
    </group>
  );
}

function PlazaDressing() {
  return (
    <group>
      <AssetModel assetKey="village.fountain" position={[0, 0.94, -4]} scale={0.55} />
      <AssetModel assetKey="village.bannerRed" position={[-3.5, 0.94, -2]} scale={1.2} />
      <AssetModel assetKey="village.bannerGreen" position={[3.5, 0.94, -2]} scale={1.2} />
      <AssetModel assetKey="village.lantern" position={[-2.2, 0.94, 3.5]} scale={1.1} />
      <AssetModel assetKey="village.lantern" position={[2.2, 0.94, 3.5]} scale={1.1} />
      <AssetModel assetKey="village.hedge" position={[-1.5, 0.94, -3.2]} scale={1.4} />
      <AssetModel assetKey="village.hedge" position={[1.5, 0.94, -3.2]} scale={1.4} />
    </group>
  );
}
