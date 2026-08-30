"use client";

import {
  SAND_INNER_Z,
  SCENE_SPAN,
  SURFACE_Y,
  WATER_EDGE_Z,
} from "@/app/game/state/island";

export function Shoreline() {
  const sandDepth = WATER_EDGE_Z - SAND_INNER_Z;
  const sandCenterZ = SAND_INNER_Z + sandDepth / 2;

  return (
    <group>
      {/* Warm sand band — full shore span, no platform blocks or boulders */}
      <mesh rotation-x={-Math.PI / 2} position={[0, SURFACE_Y - 0.06, sandCenterZ]} receiveShadow>
        <planeGeometry args={[SCENE_SPAN, sandDepth + 1.5]} />
        <meshStandardMaterial color="#d4a05a" roughness={0.98} />
      </mesh>
      {/* Soft foam line where sand meets the water tiles */}
      <mesh rotation-x={-Math.PI / 2} position={[0, SURFACE_Y - 0.045, WATER_EDGE_Z - 0.35]}>
        <planeGeometry args={[SCENE_SPAN, 1.2]} />
        <meshStandardMaterial color="#e8c992" roughness={0.99} transparent opacity={0.7} />
      </mesh>
    </group>
  );
}
