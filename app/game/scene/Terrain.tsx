"use client";

import { Island } from "./terrain/Island";
import { Shoreline } from "./terrain/Shoreline";
import { StoneOutcrops } from "./terrain/StoneOutcrops";
import { Water } from "./terrain/Water";

type TerrainProps = {
  lowQuality: boolean;
  onReset: () => void;
};

export function Terrain({ lowQuality, onReset }: TerrainProps) {
  return (
    <group>
      <Water lowQuality={lowQuality} />
      <Island onReset={onReset} />
      <Shoreline />
      <StoneOutcrops />
    </group>
  );
}
