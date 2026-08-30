"use client";

import { PlacementShop } from "./PlacementShop";
import type { PlacableShopItem } from "@/app/game/state/placable-catalog";

type EditModeHudProps = {
  saving: boolean;
  error: string | null;
  shopOpen: boolean;
  armedShopId: string | null;
  replaceHint: boolean;
  canRemove: boolean;
  onDone: () => void;
  onToggleShop: () => void;
  onRemove: () => void;
  onArmShopItem: (item: PlacableShopItem) => void;
  onCloseShop: () => void;
};

export function EditModeHud({
  saving,
  error,
  shopOpen,
  armedShopId,
  replaceHint,
  canRemove,
  onDone,
  onToggleShop,
  onRemove,
  onArmShopItem,
  onCloseShop,
}: EditModeHudProps) {
  return (
    <>
      <div className="clan-edit-toolbar" role="toolbar" aria-label="Layout editor">
        <span className="clan-quality-chip">
          {saving ? "Saving…" : error ? "Save failed" : "Autosave on"}
        </span>
        <button type="button" className="clan-edit-button" onClick={onToggleShop}>Shop</button>
        <button type="button" className="clan-edit-button" onClick={onRemove} disabled={!canRemove}>Remove</button>
        <button type="button" className="clan-edit-button clan-edit-button-primary" onClick={onDone}>
          Done
        </button>
        {error ? <span className="clan-edit-error">{error}</span> : null}
      </div>
      <PlacementShop
        open={shopOpen}
        armedShopId={armedShopId}
        replaceHint={replaceHint}
        onClose={onCloseShop}
        onArm={onArmShopItem}
      />
    </>
  );
}
