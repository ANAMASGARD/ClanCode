"use client";

import dynamic from "next/dynamic";

const ClanGame = dynamic(
  () => import("@/app/game/ClanGame").then((module) => module.ClanGame),
  {
    ssr: false,
    loading: () => (
      <div className="clan-loading" role="status">
        <span className="clan-loading-sigil">CC</span>
        <strong>ClanCode</strong>
        <p>Building your clan…</p>
        <div><i /></div>
      </div>
    ),
  },
);

export function ClanGameClient() {
  return <ClanGame />;
}
