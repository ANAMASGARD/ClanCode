"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

import type { ClanRunView } from "@/app/lib/clan-run/types";
import { useDevicePresence } from "@/app/game/hooks/useDevicePresence";
import { ClanCommandChat } from "@/app/game/hud/ClanCommandDock";
import { harnessPresenceLabel } from "@/app/game/hud/harness-presence-label";
import { buildingStatusFromProjection } from "@/app/game/state/building-projection";
import type { ClanPlacement } from "@/app/game/state/clan-layout";
import type { SemanticBuilding } from "@/app/game/state/default-layout";
import { findShopItem } from "@/app/game/state/placable-catalog";

type GameHudProps = {
  buildings: readonly SemanticBuilding[];
  selected: SemanticBuilding | null;
  muted: boolean;
  lowQuality: boolean;
  editMode: boolean;
  runBusy?: boolean;
  runView: ClanRunView;
  selectedPlacement?: ClanPlacement | null;
  onRemovePlacement?: () => void;
  onHome: () => void;
  onAudio: () => void;
  onInteract: () => void;
  onSelectBuilding: (building: SemanticBuilding) => void;
  onToggleEditMode: () => void;
  onFocusCastle?: () => void;
  onCloseCastle?: () => void;
};

export function GameHud({
  buildings,
  selected,
  muted,
  lowQuality,
  editMode,
  runBusy = false,
  runView,
  selectedPlacement = null,
  onRemovePlacement,
  onHome,
  onAudio,
  onInteract,
  onSelectBuilding,
  onToggleEditMode,
  onFocusCastle,
  onCloseCastle,
}: GameHudProps) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [buildingsOpen, setBuildingsOpen] = useState(false);
  const { user, isLoaded } = useUser();
  const castleSelected = selected?.id === "town-hall";
  const presence = useDevicePresence(castleSelected);
  const deviceOnline = presence.online === true;
  const presenceLabel = harnessPresenceLabel(presence.online, presence.checking);
  const islandLabel = isLoaded
    ? (user?.firstName ?? user?.username ?? user?.fullName ?? "Island")
    : "Island";

  const showCastleChat = castleSelected && !editMode;

  return (
    <div className="clan-hud" aria-label="ClanCode game controls">
      <header className="clan-topbar">
        <motion.div className="clan-brand-card" initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }}>
          <span className="clan-brand-mark">CC</span>
          <span><strong>ClanCode</strong><small>{islandLabel}</small></span>
        </motion.div>
        <div className="clan-utilities">
          <span
            className={`clan-presence ${deviceOnline ? "is-online" : ""}`}
            title="Paired AI harness presence"
          >
            <i />
            {presenceLabel}
          </span>
          <HudButton label={muted ? "Unmute island" : "Mute island"} onClick={onAudio} icon={muted ? "♪" : "♫"} />
          <HudButton label="Camera home" onClick={() => { onInteract(); onHome(); }} icon="⌂" />
          <HudButton label="Help" onClick={() => { onInteract(); setHelpOpen((open) => !open); }} icon="?" />
          <span className="clan-user"><UserButton /></span>
        </div>
      </header>

      <nav className="clan-rail" aria-label="Clan navigation">
        <HudButton
          label="Clan Castle"
          active={castleSelected}
          onClick={() => {
            onInteract();
            onFocusCastle?.();
          }}
          icon="⌂"
        />
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
        <button
          type="button"
          className={`clan-hud-button ${editMode ? "clan-hud-button-active" : ""}`}
          aria-label="Edit clan layout"
          title="Edit layout — click buildings to move or remove"
          onClick={() => {
            onInteract();
            onToggleEditMode();
          }}
        >✥</button>
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
        {showCastleChat ? (
          <motion.aside
            key="castle-chat"
            className="clan-context-panel clan-context-panel-chat"
            initial={{ opacity: 0, x: 24, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <ClanCommandChat
              view={runView}
              deviceOnline={deviceOnline}
              presenceLabel={presenceLabel}
              editMode={editMode}
              onClose={() => onCloseCastle?.()}
              onInteract={onInteract}
            />
          </motion.aside>
        ) : selectedPlacement ? (
          <motion.aside
            key={`placement-${selectedPlacement.id}`}
            className="clan-context-panel"
            aria-live="polite"
            initial={{ opacity: 0, x: 24, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <PlacementCard
              placement={selectedPlacement}
              runBusy={runBusy}
              onRemove={onRemovePlacement}
            />
          </motion.aside>
        ) : selected ? (
          <motion.aside
            key={selected.id}
            className="clan-context-panel"
            aria-live="polite"
            initial={{ opacity: 0, x: 24, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <BuildingStatusCard building={selected} runView={runView} deviceOnline={deviceOnline} />
          </motion.aside>
        ) : null}
      </AnimatePresence>

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

function placementCardLabel(placement: ClanPlacement): string {
  if (placement.kind === "decorative") {
    return findShopItem(`prefab-${placement.prefab}`)?.label ?? placement.prefab;
  }
  if (placement.kind === "prop") {
    return findShopItem(`prop-${placement.assetKey}`)?.label ?? placement.assetKey;
  }
  return "Building";
}

function PlacementCard({
  placement,
  runBusy,
  onRemove,
}: {
  placement: ClanPlacement;
  runBusy: boolean;
  onRemove?: () => void;
}) {
  if (placement.kind === "semantic") {
    return null;
  }

  const label = placementCardLabel(placement);

  return (
    <>
      <span className="clan-eyebrow">Island placement</span>
      <h2>{label}</h2>
      <p>Tap Remove to clear this spot, then open layout edit (✥) to place something new.</p>
      <button
        type="button"
        className="clan-secondary-action"
        disabled={runBusy}
        onClick={() => onRemove?.()}
      >
        Remove building
      </button>
    </>
  );
}

function BuildingStatusCard({
  building,
  runView,
  deviceOnline,
}: {
  building: SemanticBuilding;
  runView: ClanRunView;
  deviceOnline: boolean;
}) {
  const projection = buildingStatusFromProjection(building.id, {
    ...runView,
    deviceOnline,
  });

  return (
    <>
      <span className="clan-eyebrow">Semantic building</span>
      <h2>{building.name}</h2>
      <p>{building.purpose}</p>
      <dl>
        <div><dt>Status</dt><dd>{projection.status}</dd></div>
        <div><dt>Detail</dt><dd>{projection.detail}</dd></div>
        <div><dt>Placement</dt><dd>{building.movable ? "Movable in edit mode" : "Fixed"}</dd></div>
      </dl>
      {building.id === "builder-workshop" && runView.storeys > 1 ? (
        <p className="clan-chat-note">
          Workshop floors ({String(runView.storeys)}) grow after validated builds. Use ✥ layout edit to move island decorations.
        </p>
      ) : null}
    </>
  );
}

function HudButton({
  label,
  icon,
  onClick,
  active = false,
}: {
  label: string;
  icon: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={`clan-hud-button ${active ? "clan-hud-button-active" : ""}`}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {icon}
    </button>
  );
}
