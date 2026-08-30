"use client";

import { useMemo } from "react";
import type { GameAssetKey } from "@/app/game/assets/catalog";
import { CANOPY_SEED } from "@/app/game/state/island";
import { createCanopy, groupCanopyByKey, type CanopyItem } from "./forest-layout";
import { CANOPY_WARM_TINT, InstancedAsset } from "./InstancedAsset";

export function Forest({ lowQuality }: { lowQuality: boolean }) {
  const canopy = useMemo(() => createCanopy(CANOPY_SEED, lowQuality), [lowQuality]);
  const trees = useMemo(() => canopy.filter((item) => item.kind === "tree"), [canopy]);
  const rocks = useMemo(() => canopy.filter((item) => item.kind === "rock"), [canopy]);
  const treeGroups = useMemo(() => groupCanopyByKey(trees), [trees]);
  const rockGroups = useMemo(() => groupCanopyByKey(rocks), [rocks]);

  return (
    <group>
      {[...treeGroups.entries()].map(([assetKey, instances]) => {
        const shadowInstances = instances.filter((item) => item.castsShadow);
        const bulkInstances = instances.filter((item) => !item.castsShadow);
        return (
          <group key={`tree:${assetKey}`}>
            <ForestInstances assetKey={assetKey} instances={shadowInstances} castShadow tinted />
            <ForestInstances assetKey={assetKey} instances={bulkInstances} tinted />
          </group>
        );
      })}
      {[...rockGroups.entries()].map(([assetKey, instances]) => (
        <ForestInstances key={`rock:${assetKey}`} assetKey={assetKey} instances={instances} />
      ))}
    </group>
  );
}

function ForestInstances({
  assetKey,
  instances,
  castShadow = false,
  tinted = false,
}: {
  assetKey: GameAssetKey;
  instances: CanopyItem[];
  castShadow?: boolean;
  tinted?: boolean;
}) {
  if (instances.length === 0) return null;
  return (
    <InstancedAsset
      assetKey={assetKey}
      instances={instances}
      castShadow={castShadow}
      receiveShadow={!castShadow}
      tint={tinted ? CANOPY_WARM_TINT : null}
    />
  );
}
