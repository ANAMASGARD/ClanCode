"use client";

import { AnimatePresence, motion } from "framer-motion";

import type { ClanPlacement } from "@/app/game/state/clan-layout";
import { getPlacementId } from "@/app/game/state/clan-layout";
import { placementLabel } from "@/app/game/state/placement-label";

type RemovedBuildingsTrayProps = {
  removed: ClanPlacement[];
  busy: boolean;
  onRestore: (placementId: string) => void;
};

export function RemovedBuildingsTray({ removed, busy, onRestore }: RemovedBuildingsTrayProps) {
  return (
    <AnimatePresence>
      {removed.length > 0 ? (
        <motion.aside
          className="clan-removed-tray"
          aria-label="Removed buildings"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
        >
          <strong>Removed buildings</strong>
          <p className="clan-chat-note">Re-add restores each building at the tile where you deleted it.</p>
          <ul>
            {removed.map((placement) => {
              const id = getPlacementId(placement);
              return (
                <li key={id}>
                  <span>
                    {placementLabel(placement)}
                    <small>
                      tile ({String(placement.tileX)}, {String(placement.tileZ)})
                    </small>
                  </span>
                  <button
                    type="button"
                    className="clan-readd-action"
                    disabled={busy}
                    onClick={() => onRestore(id)}
                  >
                    Re-add
                  </button>
                </li>
              );
            })}
          </ul>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
