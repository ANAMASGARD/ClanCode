"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import {
  Box3,
  Group,
  Material,
  Mesh,
  Vector3,
} from "three";
import {
  CORE_GAME_ASSET_KEYS,
  gameAssetUrl,
  getGameAsset,
  type GameAssetKey,
} from "@/app/game/assets/catalog";

type AssetModelProps = {
  assetKey: GameAssetKey;
  position?: readonly [number, number, number];
  rotation?: readonly [number, number, number];
  scale?: number | readonly [number, number, number];
  castShadow?: boolean;
  receiveShadow?: boolean;
};

function cloneSceneWithMaterials(source: Group): Group {
  const clone = source.clone(true) as Group;
  clone.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    if (Array.isArray(object.material)) {
      object.material = object.material.map((material) => material.clone());
    } else if (object.material) {
      object.material = object.material.clone();
    }
  });
  return clone;
}

function applyPivot(
  clone: Group,
  pivotMode: "preserve-origin" | "ground-center" | "custom",
  pivotOffset: readonly [number, number, number],
): Group {
  if (pivotMode === "preserve-origin") {
    clone.position.set(pivotOffset[0], pivotOffset[1], pivotOffset[2]);
    return clone;
  }

  const bounds = new Box3().setFromObject(clone);
  const center = bounds.getCenter(new Vector3());
  if (pivotMode === "ground-center") {
    clone.position.set(
      -center.x + pivotOffset[0],
      -bounds.min.y + pivotOffset[1],
      -center.z + pivotOffset[2],
    );
    return clone;
  }

  clone.position.set(
    -center.x + pivotOffset[0],
    -center.y + pivotOffset[1],
    -center.z + pivotOffset[2],
  );
  return clone;
}

function applyShadows(
  clone: Group,
  castShadow: boolean,
  receiveShadow: boolean,
) {
  clone.traverse((object) => {
    if (object instanceof Mesh) {
      object.castShadow = castShadow;
      object.receiveShadow = receiveShadow;
    }
  });
}

export function AssetModel({
  assetKey,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  castShadow,
  receiveShadow,
}: AssetModelProps) {
  const definition = getGameAsset(assetKey);
  const { scene } = useGLTF(gameAssetUrl(assetKey));
  const baseRotation = definition.baseRotation ?? [0, 0, 0];

  const normalized = useMemo(() => {
    const clone = cloneSceneWithMaterials(scene as Group);
    applyPivot(clone, definition.pivotMode, definition.pivotOffset);
    applyShadows(
      clone,
      castShadow ?? definition.castsShadow,
      receiveShadow ?? definition.receivesShadow,
    );
    return clone;
  }, [
    castShadow,
    definition.castsShadow,
    definition.pivotMode,
    definition.pivotOffset,
    definition.receivesShadow,
    receiveShadow,
    scene,
  ]);

  const scalar = definition.uniformScale;
  const resolvedScale =
    typeof scale === "number"
      ? ([scalar * scale, scalar * scale, scalar * scale] as const)
      : ([scalar * scale[0], scalar * scale[1], scalar * scale[2]] as const);

  return (
    <group
      position={position}
      rotation={[baseRotation[0] + rotation[0], baseRotation[1] + rotation[1], baseRotation[2] + rotation[2]]}
      scale={resolvedScale}
    >
      <primitive object={normalized} />
    </group>
  );
}

for (const key of CORE_GAME_ASSET_KEYS) {
  useGLTF.preload(gameAssetUrl(key));
}

export type { Material };
