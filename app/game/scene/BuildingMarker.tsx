"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { PropsWithChildren } from "react";
import { useRef, useState } from "react";
import { Group, MathUtils } from "three";
import type { SemanticBuilding } from "@/app/game/state/default-layout";

type BuildingMarkerProps = PropsWithChildren<{
  building: SemanticBuilding;
  selected: boolean;
  onSelect: (building: SemanticBuilding) => void;
  radius?: number;
}>;

export function BuildingMarker({
  building,
  children,
  selected,
  onSelect,
  radius = 2.8,
}: BuildingMarkerProps) {
  const group = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (!group.current) return;
    const target = selected ? 1.045 : hovered ? 1.025 : 1;
    const next = MathUtils.damp(group.current.scale.x, target, 9, delta);
    group.current.scale.setScalar(next);
    group.current.position.y = MathUtils.damp(
      group.current.position.y,
      selected ? 0.18 : hovered ? 0.08 : 0,
      9,
      delta,
    );
  });

  return (
    <group ref={group}>
      <mesh
        position-y={3.2}
        onPointerDown={(event) => {
          event.stopPropagation();
          onSelect(building);
        }}
        onClick={(event) => event.stopPropagation()}
        onPointerEnter={(event) => {
          event.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerLeave={() => {
          setHovered(false);
          document.body.style.cursor = "default";
        }}
      >
        <cylinderGeometry args={[radius, radius, 6.4, 18]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>
      {children}
      {(hovered || selected) ? (
        <mesh rotation-x={-Math.PI / 2} position-y={0.08}>
          <ringGeometry args={[radius, radius + 0.16, 48]} />
          <meshBasicMaterial color={selected ? "#ffd36a" : "#7fffd4"} transparent opacity={0.9} depthWrite={false} />
        </mesh>
      ) : null}
      {hovered && !selected ? (
        <Html center position={[0, 4.2, 0]} style={{ pointerEvents: "none" }}>
          <span className="clan-world-label">{building.name}</span>
        </Html>
      ) : null}
    </group>
  );
}
