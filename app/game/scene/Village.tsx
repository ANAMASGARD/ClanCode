"use client";

import type { SemanticBuilding, SemanticBuildingId } from "@/app/game/state/default-layout";
import { DEFAULT_CLAN_LAYOUT } from "@/app/game/state/default-layout";
import { BuildingMarker } from "./BuildingMarker";
import { AssetModel } from "./AssetModel";
import {
  ApprovalGate,
  BuilderWorkshop,
  Farm,
  Market,
  ModelShrine,
  SearchTower,
  SessionLodge,
  TestCamp,
  TownHall,
  ValidationForge,
  Watermill,
  Windmill,
} from "@/app/game/prefabs/SemanticBuildings";

type VillageProps = {
  selectedId: SemanticBuildingId | null;
  onSelect: (building: SemanticBuilding) => void;
  reducedMotion: boolean;
};

const PREFABS: Record<SemanticBuildingId, (props: { reducedMotion: boolean }) => React.ReactNode> = {
  "town-hall": () => <TownHall />,
  "search-tower": () => <SearchTower />,
  "builder-workshop": () => <BuilderWorkshop />,
  "validation-forge": () => <ValidationForge />,
  "session-lodge": () => <SessionLodge />,
  "model-shrine": () => <ModelShrine />,
  "approval-gate": () => <ApprovalGate />,
  "test-camp": () => <TestCamp />,
  market: () => <Market />,
  windmill: ({ reducedMotion }) => <Windmill reducedMotion={reducedMotion} />,
  watermill: ({ reducedMotion }) => <Watermill reducedMotion={reducedMotion} />,
  farm: () => <Farm />,
};

const MARKER_RADIUS: Partial<Record<SemanticBuildingId, number>> = {
  "town-hall": 6.3,
  "approval-gate": 4.5,
  market: 3.6,
  farm: 4.2,
};

export function Village({ selectedId, onSelect, reducedMotion }: VillageProps) {
  return (
    <group>
      <VillagePaths />
      {DEFAULT_CLAN_LAYOUT.map((building) => (
        <group key={building.id} position={building.position}>
          <BuildingMarker
            building={building}
            selected={selectedId === building.id}
            onSelect={onSelect}
            radius={MARKER_RADIUS[building.id]}
          >
            {PREFABS[building.id]({ reducedMotion })}
          </BuildingMarker>
        </group>
      ))}
      <AssetModel assetKey="village.fountain" position={[-1, 0.92, -6]} scale={3.2} />
      <AssetModel assetKey="village.bannerRed" position={[-4, 0.9, -3]} scale={3} />
      <AssetModel assetKey="village.bannerGreen" position={[4, 0.9, -3]} scale={3} />
    </group>
  );
}

function VillagePaths() {
  const radial = [
    [-5, 0, 0], [5, 0, 0], [0, -5, 0], [0, 5, 0],
    [-9, 6, Math.PI / 2], [8, 7, Math.PI / 2],
    [-8, -8, Math.PI / 2], [8, -8, Math.PI / 2],
  ] as const;
  return (
    <group position-y={0.82}>
      {radial.map(([x, z, rotation], index) => (
        <AssetModel
          key={`${x}:${z}:${index}`}
          assetKey={index % 3 === 0 ? "village.roadBend" : "village.road"}
          position={[x, 0, z]}
          rotation={[0, rotation, 0]}
          scale={5}
        />
      ))}
    </group>
  );
}
