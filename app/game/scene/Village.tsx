"use client";

import { useMemo } from "react";
import type { SemanticBuilding, SemanticBuildingId } from "@/app/game/state/default-layout";
import { buildSemanticBuildingsFromLayout } from "@/app/game/state/default-layout";
import type { ClanPlacement } from "@/app/game/state/clan-layout";
import { isEditablePlacement } from "@/app/game/state/clan-layout";
import { layoutWorldPosition, ROAD_TILE_SCALE, ROAD_TILES } from "@/app/game/state/roads";
import { BUILDING_VISUAL_SCALE, GROUND_Y } from "@/app/game/state/tile";
import {
  BEACH_WALL,
  BEACH_WALL_TOWERS,
  wallWorldPosition,
} from "@/app/game/state/walls";
import { DECORATIVE_PREFABS, getSemanticPrefab } from "@/app/game/prefabs/registry";
import { BuildingMarker } from "./BuildingMarker";
import { AssetModel } from "./AssetModel";
import { EditablePlacement, PlotGroundPicker } from "./EditablePlacement";
import { InstancedAsset } from "./InstancedAsset";

type VillageProps = {
  layout: ClanPlacement[];
  editMode: boolean;
  selectedId: SemanticBuildingId | null;
  selectedPlacementId: string | null;
  shopArmed: boolean;
  onSelect: (building: SemanticBuilding) => void;
  onSelectPlacement: (placementId: string) => void;
  onMovePlacement: (placementId: string, tileX: number, tileZ: number) => void;
  onPickTile: (tileX: number, tileZ: number) => void;
  onDragChange: (dragging: boolean) => void;
  reducedMotion: boolean;
};

function placementInstanceId(placement: ClanPlacement): string {
  return placement.kind === "semantic" ? placement.id : placement.id;
}

function semanticRenderScale(visualScale?: number): number {
  return BUILDING_VISUAL_SCALE * (visualScale ?? 1);
}

export function Village({
  layout,
  editMode,
  selectedId,
  selectedPlacementId,
  shopArmed,
  onSelect,
  onSelectPlacement,
  onMovePlacement,
  onPickTile,
  onDragChange,
  reducedMotion,
}: VillageProps) {
  const semanticBuildings = useMemo(
    () => buildSemanticBuildingsFromLayout(layout),
    [layout],
  );

  return (
    <group>
      <BeachRampart />
      <RoadNetwork />
      {editMode ? <PlotGroundPicker armed={shopArmed} onPick={onPickTile} /> : null}
      {layout.map((placement) => {
        const id = placementInstanceId(placement);

        if (placement.kind === "semantic") {
          const building = semanticBuildings.find((entry) => entry.id === placement.id);
          if (!building) return null;
          const prefab = getSemanticPrefab(placement.id);
          const Component = prefab.component;
          const renderScale = semanticRenderScale(prefab.visualScale);

          if (editMode && isEditablePlacement(placement)) {
            return (
              <EditablePlacement
                key={id}
                placement={placement}
                placementId={id}
                layout={layout}
                selected={selectedPlacementId === id}
                onSelect={onSelectPlacement}
                onMove={onMovePlacement}
                onDragChange={onDragChange}
                radius={prefab.selectionRadius}
                scale={renderScale}
              >
                <Component reducedMotion={reducedMotion} />
              </EditablePlacement>
            );
          }

          return (
            <group key={id} position={building.position} scale={renderScale}>
              <BuildingMarker
                building={building}
                selected={selectedId === placement.id}
                onSelect={onSelect}
                radius={prefab.selectionRadius}
              >
                <Component reducedMotion={reducedMotion} />
              </BuildingMarker>
            </group>
          );
        }

        if (placement.kind === "decorative") {
          const Component = DECORATIVE_PREFABS[placement.prefab];
          if (editMode) {
            return (
              <EditablePlacement
                key={id}
                placement={placement}
                placementId={id}
                layout={layout}
                selected={selectedPlacementId === id}
                onSelect={onSelectPlacement}
                onMove={onMovePlacement}
                onDragChange={onDragChange}
                scale={BUILDING_VISUAL_SCALE}
              >
                <Component reducedMotion={reducedMotion} />
              </EditablePlacement>
            );
          }
          return (
            <group
              key={id}
              position={[placement.tileX * 2, GROUND_Y, placement.tileZ * 2]}
              rotation={[0, placement.rotation ?? 0, 0]}
              scale={BUILDING_VISUAL_SCALE}
            >
              <Component reducedMotion={reducedMotion} />
            </group>
          );
        }

        if (editMode) {
          return (
            <EditablePlacement
              key={id}
              placement={placement}
              placementId={id}
              layout={layout}
              selected={selectedPlacementId === id}
              onSelect={onSelectPlacement}
              onMove={onMovePlacement}
              onDragChange={onDragChange}
              radius={1.6}
            >
              <AssetModel assetKey={placement.assetKey} />
            </EditablePlacement>
          );
        }

        return (
          <group
            key={id}
            position={[placement.tileX * 2, GROUND_Y, placement.tileZ * 2]}
            rotation={[0, placement.rotation ?? 0, 0]}
          >
            <AssetModel assetKey={placement.assetKey} />
          </group>
        );
      })}
    </group>
  );
}

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
