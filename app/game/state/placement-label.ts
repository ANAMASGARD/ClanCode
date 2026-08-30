import { SEMANTIC_PREFABS } from "@/app/game/prefabs/registry";
import type { ClanPlacement } from "./clan-layout";
import { findShopItem } from "./placable-catalog";

/** Human-readable label for any layout placement. */
export function placementLabel(placement: ClanPlacement): string {
  if (placement.kind === "semantic") {
    return SEMANTIC_PREFABS[placement.id]?.label ?? placement.id;
  }
  if (placement.kind === "decorative") {
    return findShopItem(`prefab-${placement.prefab}`)?.label ?? placement.prefab;
  }
  return findShopItem(`prop-${placement.assetKey}`)?.label ?? placement.assetKey;
}
