"use client";

import { useMemo } from "react";
import { AssetModel } from "./AssetModel";
import { createForest } from "./forest-layout";

export function Forest({ lowQuality }: { lowQuality: boolean }) {
  const trees = useMemo(() => createForest(0xc1a7c0de, lowQuality), [lowQuality]);
  const edgeProps = [
    [17.5, -15, "nature.log"], [18.5, -8, "nature.stump"], [17.5, 5, "nature.mushrooms"],
    [19, 12, "nature.rockLarge"], [17.5, 17, "nature.flowerPurple"], [20, -2, "nature.flowerYellow"],
  ] as const;
  return (
    <group>
      {trees.map((tree, index) => (
        <AssetModel key={`${tree.key}:${index}`} assetKey={tree.key} position={tree.position} rotation={[0, tree.rotation, 0]} scale={tree.scale} />
      ))}
      {edgeProps.map(([x, z, key]) => (
        <AssetModel key={key} assetKey={key} position={[x, 0.93, z]} scale={2.4} />
      ))}
    </group>
  );
}
