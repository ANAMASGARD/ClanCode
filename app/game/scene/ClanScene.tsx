"use client";

import type { SemanticBuilding, SemanticBuildingId } from "@/app/game/state/default-layout";
import type { ClanPlacement } from "@/app/game/state/clan-layout";
import { CameraRig } from "./CameraRig";
import { Forest } from "./Forest";
import { Harbor } from "./Harbor";
import { Lighting } from "./Lighting";
import { Terrain } from "./Terrain";
import { Village } from "./Village";
import { Villagers } from "./Villagers";

type ClanSceneProps = {
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
  onReset: () => void;
  focus: readonly [number, number, number] | null;
  resetToken: number;
  lowQuality: boolean;
  reducedMotion: boolean;
};

export function ClanScene(props: ClanSceneProps) {
  return (
    <>
      <Lighting lowQuality={props.lowQuality} />
      <Terrain lowQuality={props.lowQuality} onReset={props.onReset} />
      <Village
        layout={props.layout}
        editMode={props.editMode}
        selectedId={props.selectedId}
        selectedPlacementId={props.selectedPlacementId}
        shopArmed={props.shopArmed}
        onSelect={props.onSelect}
        onSelectPlacement={props.onSelectPlacement}
        onMovePlacement={props.onMovePlacement}
        onPickTile={props.onPickTile}
        onDragChange={props.onDragChange}
        reducedMotion={props.reducedMotion}
      />
      <Harbor reducedMotion={props.reducedMotion} />
      <Villagers layout={props.layout} reducedMotion={props.reducedMotion} />
      <Forest lowQuality={props.lowQuality} />
      <CameraRig
        focus={props.focus}
        resetToken={props.resetToken}
        editMode={props.editMode}
      />
    </>
  );
}
