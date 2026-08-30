"use client";

import type { SemanticBuilding, SemanticBuildingId } from "@/app/game/state/default-layout";
import { CameraRig } from "./CameraRig";
import { Forest } from "./Forest";
import { Harbor } from "./Harbor";
import { Lighting } from "./Lighting";
import { Terrain } from "./Terrain";
import { Village } from "./Village";
import { Villagers } from "./Villagers";

type ClanSceneProps = {
  selectedId: SemanticBuildingId | null;
  onSelect: (building: SemanticBuilding) => void;
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
        selectedId={props.selectedId}
        onSelect={props.onSelect}
        reducedMotion={props.reducedMotion}
      />
      <Harbor reducedMotion={props.reducedMotion} />
      <Villagers reducedMotion={props.reducedMotion} />
      <Forest lowQuality={props.lowQuality} />
      <CameraRig focus={props.focus} resetToken={props.resetToken} />
    </>
  );
}
