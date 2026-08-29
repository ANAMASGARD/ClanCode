import type { Metadata } from "next";
import { ClanGameClient } from "./clan-game-client";

export const metadata: Metadata = {
  title: "Clan Island · ClanCode",
  description: "A game-like visualization of your ClanCode engineering workspace.",
};

export default function ClanPage() {
  return <ClanGameClient />;
}
