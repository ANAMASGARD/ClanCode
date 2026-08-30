"use client";

import { AnimatePresence, motion } from "framer-motion";

import {
  PLACABLE_SHOP_ITEMS,
  type PlacableCategory,
  type PlacableShopItem,
} from "@/app/game/state/placable-catalog";

const CATEGORY_LABELS: Record<PlacableCategory, string> = {
  buildings: "Buildings",
  decorations: "Decorations",
  props: "Props",
};

type PlacementShopProps = {
  open: boolean;
  armedShopId: string | null;
  replaceHint: boolean;
  onClose: () => void;
  onArm: (item: PlacableShopItem) => void;
};

export function PlacementShop({ open, armedShopId, replaceHint, onClose, onArm }: PlacementShopProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.aside
          className="clan-shop-panel"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 18 }}
          aria-label="Clan asset directory"
        >
          <header>
            <strong>Asset directory</strong>
            <button type="button" className="clan-shop-close" onClick={onClose} aria-label="Close shop">×</button>
          </header>
          {replaceHint ? <p className="clan-shop-hint">Choose a replacement for the removed item, then tap a valid tile.</p> : null}
          {(Object.keys(CATEGORY_LABELS) as PlacableCategory[]).map((category) => (
            <section key={category}>
              <h3>{CATEGORY_LABELS[category]}</h3>
              <ul>
                {PLACABLE_SHOP_ITEMS.filter((item) => item.category === category).map((item) => (
                  <li key={item.shopId}>
                    <button
                      type="button"
                      className={armedShopId === item.shopId ? "is-armed" : undefined}
                      onClick={() => onArm(item)}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
