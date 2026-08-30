"use client";

import { useMemo } from "react";
import { AssetModel } from "./AssetModel";
import { createForest } from "./forest-layout";

export function Forest({ lowQuality }: { lowQuality: boolean }) {
  const trees = useMemo(() => createForest(0xc1a7c0de, lowQuality), [lowQuality]);
  return (
    <group>
      {trees.map((tree, index) => (
        <AssetModel
          key={`${tree.key}:${index}`}
          assetKey={tree.key}
          position={tree.position}
          rotation={[0, tree.rotation, 0]}
          scale={tree.scale}
          castShadow={tree.castsShadow}
        />
      ))}
    </group>
  );
}
