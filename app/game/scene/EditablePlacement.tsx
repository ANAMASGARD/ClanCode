"use client";

import type { PropsWithChildren, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Plane, Vector2, Vector3, type Camera, type Raycaster } from "three";
import { useThree, type ThreeEvent } from "@react-three/fiber";

import type { ClanPlacement } from "@/app/game/state/clan-layout";
import { canPlaceAt } from "@/app/game/state/layout-editor";
import { clientToNdc } from "@/app/game/state/pointer-to-tile";
import { GROUND_Y, TILE, worldToTile } from "@/app/game/state/tile";

type EditablePlacementProps = PropsWithChildren<{
  placement: ClanPlacement;
  placementId: string;
  layout: ClanPlacement[];
  selected: boolean;
  onSelect: (placementId: string) => void;
  onMove: (placementId: string, tileX: number, tileZ: number) => void;
  onDragChange?: (dragging: boolean) => void;
  radius?: number;
  scale?: number;
  label?: ReactNode;
}>;

type TilePreview = { tileX: number; tileZ: number; valid: boolean };

const groundPlane = new Plane(new Vector3(0, 1, 0), -GROUND_Y);
const hitPoint = new Vector3();
const pointerNdc = new Vector2();

function pointerToTile(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
  camera: Camera,
  raycaster: Raycaster,
): { tileX: number; tileZ: number } | null {
  const ndc = clientToNdc(clientX, clientY, canvas.getBoundingClientRect());
  if (!ndc) return null;
  pointerNdc.set(ndc.x, ndc.y);
  raycaster.setFromCamera(pointerNdc, camera);
  if (!raycaster.ray.intersectPlane(groundPlane, hitPoint)) return null;
  return worldToTile(hitPoint.x, hitPoint.z);
}

export function EditablePlacement({
  placement,
  placementId,
  layout,
  selected,
  onSelect,
  onMove,
  onDragChange,
  radius = 2.4,
  scale = 1,
  label,
  children,
}: EditablePlacementProps) {
  const { camera, raycaster, gl } = useThree();
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<TilePreview | null>(null);
  const previewRef = useRef<TilePreview | null>(null);

  const resolvePreview = useCallback(
    (clientX: number, clientY: number): TilePreview | null => {
      const tile = pointerToTile(clientX, clientY, gl.domElement, camera, raycaster);
      if (!tile) return null;
      return {
        ...tile,
        valid: canPlaceAt(layout, tile.tileX, tile.tileZ, placementId).valid,
      };
    },
    [camera, gl.domElement, layout, placementId, raycaster],
  );

  useEffect(() => {
    if (!dragging) return;

    const onPointerMove = (event: PointerEvent) => {
      const next = resolvePreview(event.clientX, event.clientY);
      if (!next) return;
      previewRef.current = next;
      setPreview(next);
    };

    const finish = () => {
      const current = previewRef.current;
      if (current?.valid) {
        onMove(placementId, current.tileX, current.tileZ);
      }
      previewRef.current = null;
      setPreview(null);
      setDragging(false);
      onDragChange?.(false);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
    };
  }, [dragging, onDragChange, onMove, placementId, resolvePreview]);

  const startDrag = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    event.nativeEvent.preventDefault();
    onSelect(placementId);
    const next = resolvePreview(event.nativeEvent.clientX, event.nativeEvent.clientY);
    previewRef.current = next;
    setPreview(next);
    setDragging(true);
    onDragChange?.(true);
  };

  const tileX = preview?.tileX ?? placement.tileX;
  const tileZ = preview?.tileZ ?? placement.tileZ;
  const ringColor = preview ? (preview.valid ? "#2f9e44" : "#d9480f") : selected ? "#ffd43b" : "#2f9e44";

  return (
    <group
      position={[tileX * TILE, GROUND_Y, tileZ * TILE]}
      rotation={[0, placement.rotation ?? 0, 0]}
      scale={scale}
      onPointerDown={startDrag}
    >
      <mesh position-y={2.2}>
        <cylinderGeometry args={[radius, radius, 4.6, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>
      {children}
      {selected || dragging ? (
        <mesh rotation-x={-Math.PI / 2} position-y={0.08}>
          <ringGeometry args={[radius, radius + 0.18, 48]} />
          <meshBasicMaterial color={ringColor} transparent opacity={0.92} depthWrite={false} />
        </mesh>
      ) : null}
      {label}
    </group>
  );
}

export function PlotGroundPicker({
  onPick,
  armed,
}: {
  onPick: (tileX: number, tileZ: number) => void;
  armed: boolean;
}) {
  if (!armed) return null;
  return (
    <mesh
      rotation-x={-Math.PI / 2}
      position-y={GROUND_Y + 0.02}
      onPointerDown={(event) => {
        event.stopPropagation();
        const { tileX, tileZ } = worldToTile(event.point.x, event.point.z);
        onPick(tileX, tileZ);
      }}
    >
      <planeGeometry args={[120, 120]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}
