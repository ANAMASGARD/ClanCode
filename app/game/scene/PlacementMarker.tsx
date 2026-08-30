"use client";

import gsap from "gsap";
import type { PropsWithChildren } from "react";
import { useEffect, useRef, useState } from "react";
import { Group } from "three";

type PlacementMarkerProps = PropsWithChildren<{
  label: string;
  selected: boolean;
  onSelect: () => void;
  radius?: number;
}>;

/** Click target for removable decorative and prop placements outside edit mode. */
export function PlacementMarker({
  label: _label,
  children,
  selected,
  onSelect,
  radius = 1.4,
}: PlacementMarkerProps) {
  const group = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const marker = group.current;
    if (!marker) {
      return;
    }
    const target = selected ? 1.04 : hovered ? 1.02 : 1;
    const scaleTween = gsap.to(marker.scale, {
      x: target,
      y: target,
      z: target,
      duration: 0.18,
      ease: "power2.out",
    });
    return () => {
      scaleTween.kill();
    };
  }, [hovered, selected]);

  return (
    <group ref={group}>
      <mesh
        position-y={2.4}
        onPointerDown={(event) => {
          event.stopPropagation();
          onSelect();
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
        <cylinderGeometry args={[radius, radius, 4.8, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>
      {children}
      {hovered || selected ? (
        <mesh rotation-x={-Math.PI / 2} position-y={0.08}>
          <ringGeometry args={[radius, radius + 0.12, 40]} />
          <meshBasicMaterial color={selected ? "#ffd36a" : "#7fffd4"} transparent opacity={0.9} depthWrite={false} />
        </mesh>
      ) : null}
    </group>
  );
}
