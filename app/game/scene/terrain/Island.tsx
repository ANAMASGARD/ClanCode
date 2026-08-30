"use client";

import { useMemo } from "react";
import {
  DIRT_EDGE_SIDE,
  landFloorGeometry,
  PLOT_HALF,
  PLOT_SIDE,
  RIM_SIDE,
  SURFACE_Y,
} from "@/app/game/state/island";
import { AssetModel } from "../AssetModel";
import { createPlotMaterial } from "./plot-shader";

type IslandProps = {
  onReset: () => void;
};

export function Island({ onReset }: IslandProps) {
  const plotMaterial = useMemo(() => createPlotMaterial(2), []);

  const floor = landFloorGeometry();

  return (
    <group>
      {/* Dark forest floor — clipped at shoreline, no green overhang into sea */}
      <mesh
        rotation-x={-Math.PI / 2}
        position={[0, SURFACE_Y - 0.08, floor.centerZ]}
        receiveShadow
        onDoubleClick={(event) => {
          event.stopPropagation();
          onReset();
        }}
      >
        <planeGeometry args={[floor.width, floor.depth]} />
        <meshStandardMaterial color="#2d5a32" roughness={0.95} />
      </mesh>

      {/* Medium-green rim band */}
      <mesh rotation-x={-Math.PI / 2} position={[0, SURFACE_Y - 0.04, 0]} receiveShadow>
        <planeGeometry args={[RIM_SIDE, RIM_SIDE]} />
        <meshStandardMaterial color="#4a9a4e" roughness={0.92} />
      </mesh>

      {/* Thin dirt edge outline */}
      <mesh rotation-x={-Math.PI / 2} position={[0, SURFACE_Y - 0.02, 0]} receiveShadow>
        <planeGeometry args={[DIRT_EDGE_SIDE, DIRT_EDGE_SIDE]} />
        <meshStandardMaterial color="#8b6b42" roughness={0.98} />
      </mesh>

      {/* Light gridded plot interior */}
      <mesh rotation-x={-Math.PI / 2} position={[0, SURFACE_Y, 0]} receiveShadow>
        <planeGeometry args={[PLOT_SIDE, PLOT_SIDE]} />
        <primitive object={plotMaterial} attach="material" />
      </mesh>

      {/* Top-left dirt path accent */}
      <group position-y={SURFACE_Y + 0.01}>
        <AssetModel assetKey="nature.pathStraight" position={[-PLOT_HALF - 4, 0, -PLOT_HALF - 2]} rotation={[0, Math.PI / 4, 0]} scale={0.42} />
        <AssetModel assetKey="nature.pathStraight" position={[-PLOT_HALF - 6, 0, -PLOT_HALF - 4]} rotation={[0, Math.PI / 4, 0]} scale={0.42} />
        <AssetModel assetKey="nature.pathBend" position={[-PLOT_HALF - 2, 0, -PLOT_HALF - 5]} rotation={[0, -Math.PI / 4, 0]} scale={0.42} />
      </group>
    </group>
  );
}
