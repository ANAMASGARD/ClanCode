"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import { Box3, Group, Mesh, Vector3 } from "three";
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
};

export function AssetModel({
  assetKey,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: AssetModelProps) {
  const definition = getGameAsset(assetKey);
  const { scene } = useGLTF(gameAssetUrl(assetKey));
  const normalized = useMemo(() => {
    const clone = scene.clone(true) as Group;
    const bounds = new Box3().setFromObject(clone);
    const center = bounds.getCenter(new Vector3());
    clone.position.set(-center.x, -bounds.min.y, -center.z);
    clone.traverse((object) => {
      if (object instanceof Mesh) {
        object.castShadow = definition.castsShadow;
        object.receiveShadow = definition.receivesShadow;
      }
    });
    return clone;
  }, [definition.castsShadow, definition.receivesShadow, scene]);
  const scalar = definition.defaultScale;
  const resolvedScale = typeof scale === "number"
    ? [scalar * scale, scalar * scale, scalar * scale] as const
    : [scalar * scale[0], scalar * scale[1], scalar * scale[2]] as const;

  return (
    <group position={position} rotation={rotation} scale={resolvedScale}>
      <primitive object={normalized} />
    </group>
  );
}

for (const key of CORE_GAME_ASSET_KEYS) useGLTF.preload(gameAssetUrl(key));
