import { createContext, useContext } from "react";

import { emptyClanRunView, type ClanRunView } from "@/app/lib/clan-run/types";
import { GROUND_Y } from "@/app/game/state/tile";

export type ClanRunVizValue = {
  snapshot: ClanRunView;
  workshopWorld: readonly [number, number, number];
  reducedMotion: boolean;
};

export const ClanRunVizContext = createContext<ClanRunVizValue>({
  snapshot: emptyClanRunView(),
  workshopWorld: [16, GROUND_Y, -16],
  reducedMotion: false,
});

export function useClanRunViz(): ClanRunVizValue {
  return useContext(ClanRunVizContext);
}