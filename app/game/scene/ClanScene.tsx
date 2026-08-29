"use client";

import type { SemanticBuilding, SemanticBuildingId } from "@/app/game/state/default-layout";
import { CameraRig } from "./CameraRig";
import { Forest } from "./Forest";
import { Harbor } from "./Harbor";
import { Lighting } from "./Lighting";
import { Terrain } from "./Terrain";
import { Village } from "./Village";

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
      <color attach="background" args={["#7fb9b1"]} />
      <Lighting lowQuality={props.lowQuality} />
      <Terrain lowQuality={props.lowQuality} reducedMotion={props.reducedMotion} onReset={props.onReset} />
      <Forest lowQuality={props.lowQuality} />
      <Harbor lowQuality={props.lowQuality} reducedMotion={props.reducedMotion} />
      <Village selectedId={props.selectedId} onSelect={props.onSelect} reducedMotion={props.reducedMotion} />
      <CameraRig focus={props.focus} resetToken={props.resetToken} />
    </>
  );
}
