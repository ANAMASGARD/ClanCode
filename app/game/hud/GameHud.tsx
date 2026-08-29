"use client";

import { UserButton } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { SemanticBuilding } from "@/app/game/state/default-layout";

type GameHudProps = {
  buildings: readonly SemanticBuilding[];
  selected: SemanticBuilding | null;
  muted: boolean;
  lowQuality: boolean;
  onHome: () => void;
  onAudio: () => void;
  onInteract: () => void;
  onSelectBuilding: (building: SemanticBuilding) => void;
};

export function GameHud({ buildings, selected, muted, lowQuality, onHome, onAudio, onInteract, onSelectBuilding }: GameHudProps) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [buildingsOpen, setBuildingsOpen] = useState(false);
  return (
    <div className="clan-hud" aria-label="ClanCode game controls">
      <header className="clan-topbar">
        <motion.div className="clan-brand-card" initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }}>
          <span className="clan-brand-mark">CC</span>
          <span><strong>ClanCode</strong><small>Personal island</small></span>
        </motion.div>
        <motion.div className="clan-quest-card" initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <span className="clan-mode-badge">PLAN</span>
          <span><small>Current quest</small><strong>Village foundation ready</strong></span>
        </motion.div>
        <div className="clan-utilities">
          <DevicePresence />
          <HudButton label={muted ? "Unmute island" : "Mute island"} onClick={onAudio} icon={muted ? "♪" : "♫"} />
          <HudButton label="Camera home" onClick={() => { onInteract(); onHome(); }} icon="⌂" />
          <HudButton label="Help" onClick={() => { onInteract(); setHelpOpen((open) => !open); }} icon="?" />
          <span className="clan-user"><UserButton /></span>
        </div>
      </header>

      <nav className="clan-rail" aria-label="Clan navigation">
        <HudButton label="Town Hall" onClick={() => { onInteract(); onSelectBuilding(buildings[0]); }} icon="⌂" />
        <button
          type="button"
          className="clan-hud-button"
          aria-label="Semantic building directory"
          aria-expanded={buildingsOpen}
          aria-controls="clan-building-directory"
          title="Buildings"
          onClick={() => {
            onInteract();
            setBuildingsOpen((open) => !open);
          }}
        >⌘</button>
        <Link href="/dashboard/devices" className="clan-hud-button" aria-label="Devices" onClick={onInteract}>⌁</Link>
        <HudButton label="Sessions (coming soon)" onClick={onInteract} icon="◫" />
        <HudButton label="Models (coming soon)" onClick={onInteract} icon="◇" />
        <button type="button" className="clan-hud-button clan-hud-button-disabled" aria-label="Edit layout arrives in the next milestone" disabled>✥</button>
      </nav>

      <AnimatePresence>
        {buildingsOpen ? (
          <motion.nav
            id="clan-building-directory"
            className="clan-building-directory"
            aria-label="Semantic buildings"
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -14 }}
          >
            <strong>Buildings</strong>
            <span>Select a destination to focus it in the village.</span>
            <ul>
              {buildings.map((building) => (
                <li key={building.id}>
                  <button
                    type="button"
                    aria-pressed={selected?.id === building.id}
                    onClick={() => {
                      onInteract();
                      onSelectBuilding(building);
                    }}
                  >
                    <strong>{building.name}</strong>
                    <span>{building.purpose}</span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.nav>
        ) : null}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {selected ? (
          <motion.aside
            key={selected.id}
            className="clan-context-panel"
            aria-live="polite"
            initial={{ opacity: 0, x: 24, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <span className="clan-eyebrow">Semantic building</span>
            <h2>{selected.name}</h2>
            <p>{selected.purpose}</p>
            <dl>
              <div><dt>Status</dt><dd>{selected.status}</dd></div>
              <div><dt>Assigned agent</dt><dd>None — idle</dd></div>
              <div><dt>Placement</dt><dd>{selected.movable ? "Movable in PR2" : "Fixed"}</dd></div>
            </dl>
            <span className="clan-truth-note">Presentation only — no run is active.</span>
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <motion.div className="clan-task-dock" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
        <span className="clan-task-glyph">›_</span>
        <span><strong>Task control connects next</strong><small>The paired-laptop run pipeline is not wired in this foundation.</small></span>
        <button type="button" disabled>Start quest</button>
      </motion.div>

      <AnimatePresence>
        {helpOpen ? (
          <motion.aside className="clan-help" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
            <strong>Explore the clan</strong>
            <span>Drag to pan · scroll or pinch to zoom · select a building to focus · double-click grass or press Home to reset.</span>
            <span className="clan-quality-chip">{lowQuality ? "Adaptive quality" : "High quality"}</span>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function HudButton({ label, icon, onClick }: { label: string; icon: string; onClick: () => void }) {
  return <button type="button" className="clan-hud-button" aria-label={label} title={label} onClick={onClick}>{icon}</button>;
}

function DevicePresence() {
  const [online, setOnline] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/devices", { cache: "no-store" });
        const payload = response.ok ? await response.json() as { devices?: Array<{ online: boolean }> } : null;
        if (active) setOnline(Boolean(payload?.devices?.some((device) => device.online)));
      } catch {
        if (active) setOnline(false);
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 10000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  return (
    <span className={`clan-presence ${online ? "is-online" : ""}`} title="Paired device presence">
      <i />{online === null ? "Checking" : online ? "Laptop online" : "Laptop offline"}
    </span>
  );
}
