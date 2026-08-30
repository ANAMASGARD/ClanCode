"use client";

import { useMemo } from "react";
import type { SemanticBuilding, SemanticBuildingId } from "@/app/game/state/default-layout";
import { DEFAULT_CLAN_LAYOUT } from "@/app/game/state/default-layout";
import { DECORATIVE_PLACEMENTS } from "@/app/game/state/decorative-layout";
import { layoutWorldPosition, ROAD_TILE_SCALE, ROAD_TILES } from "@/app/game/state/roads";
import { GROUND_Y, tileToWorld } from "@/app/game/state/tile";
import {
  BEACH_WALL,
  BEACH_WALL_TOWERS,
  wallWorldPosition,
} from "@/app/game/state/walls";
import { DECORATIVE_PREFABS, getSemanticPrefab } from "@/app/game/prefabs/registry";
import { BuildingMarker } from "./BuildingMarker";
import { AssetModel } from "./AssetModel";
import { InstancedAsset } from "./InstancedAsset";

type VillageProps = {
  selectedId: SemanticBuildingId | null;
  onSelect: (building: SemanticBuilding) => void;
  reducedMotion: boolean;
};

export function Village({ selectedId, onSelect, reducedMotion }: VillageProps) {
  return (
    <group>
      <BeachRampart />
      <RoadNetwork />
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
            position={[x, GROUND_Y, z]}
            rotation={[0, placement.rotation ?? 0, 0]}
          >
            <Component reducedMotion={reducedMotion} />
          </group>
        );
      })}
    </group>
  );
}

/** The only wall in the scene: a rampart facing the beach, with a gate. */
function BeachRampart() {
  const wallInstances = useMemo(
    () =>
      BEACH_WALL.map((segment) => {
        const [x, , z] = wallWorldPosition(segment);
        return {
          position: [x, GROUND_Y, z] as const,
          rotation: segment.rotation,
          scale: 1,
        };
      }),
    [],
  );

  return (
    <group>
      <InstancedAsset
        assetKey="harbor.castleWall"
        instances={wallInstances}
        castShadow
        receiveShadow
      />
      {BEACH_WALL_TOWERS.map((tower) => {
        const [x, , z] = wallWorldPosition(tower);
        return (
          <AssetModel
            key={tower.id}
            assetKey={tower.assetKey}
            position={[x, GROUND_Y, z]}
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
      {ROAD_TILES.map((tile) => (
        <AssetModel
          key={tile.id}
          assetKey={tile.assetKey}
          position={layoutWorldPosition(tile.tileX, tile.tileZ)}
          rotation={[0, tile.rotation, 0]}
          scale={ROAD_TILE_SCALE}
        />
      ))}
    </group>
  );
}
