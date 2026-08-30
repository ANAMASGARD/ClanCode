"use client";

import type { SemanticBuilding, SemanticBuildingId } from "@/app/game/state/default-layout";
import type { ClanPlacement } from "@/app/game/state/clan-layout";
import { placementWorldPosition } from "@/app/game/state/clan-layout";
import { GROUND_Y, tileToWorld } from "@/app/game/state/tile";
import type { ClanRunView } from "@/app/lib/clan-run/types";
import { CameraRig } from "./CameraRig";
import { ClanRunVizContext } from "./ClanRunVizContext";
import { ConstructionCrew } from "./ConstructionCrew";
import { ConstructionSite } from "./ConstructionSite";
import { WorkshopCompletionFx } from "./WorkshopCompletionFx";
import { Forest } from "./Forest";
import { Harbor } from "./Harbor";
import { Lighting } from "./Lighting";
import { PrCourierShip } from "./PrCourierShip";
import { Terrain } from "./Terrain";
import { Village } from "./Village";
import { Villagers } from "./Villagers";

type ClanSceneProps = {
  layout: ClanPlacement[];
  editMode: boolean;
  selectedId: SemanticBuildingId | null;
  selectedPlacementId: string | null;
  shopArmed: boolean;
  snapshot: ClanRunView;
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

function workshopWorldFromLayout(layout: readonly ClanPlacement[]): readonly [number, number, number] {
  const workshop = layout.find(
    (placement) => placement.kind === "semantic" && placement.id === "builder-workshop",
  );
  if (workshop !== undefined) {
    return placementWorldPosition(workshop);
  }
  return tileToWorld(8, -8, GROUND_Y);
}

export function ClanScene(props: ClanSceneProps) {
  const workshopWorld = workshopWorldFromLayout(props.layout);

  return (
    <ClanRunVizContext.Provider
      value={{
        snapshot: props.snapshot,
        workshopWorld,
        reducedMotion: props.reducedMotion,
      }}
    >
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
      <PrCourierShip reducedMotion={props.reducedMotion} />
      <ConstructionSite />
      <WorkshopCompletionFx reducedMotion={props.reducedMotion} />
      <ConstructionCrew reducedMotion={props.reducedMotion} />
      <Villagers layout={props.layout} reducedMotion={props.reducedMotion} />
      <Forest lowQuality={props.lowQuality} />
      <CameraRig
        focus={props.focus}
        resetToken={props.resetToken}
        editMode={props.editMode}
      />
    </ClanRunVizContext.Provider>
  );
}