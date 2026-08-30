"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

import type { ClanRunView } from "@/app/lib/clan-run/types";
import { useDevicePresence } from "@/app/game/hooks/useDevicePresence";
import { ClanCommandChat } from "@/app/game/hud/ClanCommandDock";
import { SessionLogPanel } from "@/app/game/hud/SessionLogPanel";
import { useSessionLogs } from "@/app/game/hooks/useSessionLogs";
import { RemovedBuildingsTray } from "@/app/game/hud/RemovedBuildingsTray";
import { harnessPresenceLabel } from "@/app/game/hud/harness-presence-label";
import { buildingStatusFromProjection } from "@/app/game/state/building-projection";
import type { ClanPlacement } from "@/app/game/state/clan-layout";
import { canRemovePlacement, canRemoveSemanticBuilding } from "@/app/game/state/clan-layout";
import type { SemanticBuilding } from "@/app/game/state/default-layout";
import { placementLabel } from "@/app/game/state/placement-label";

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
  onDeleteBuilding?: (buildingId: SemanticBuilding["id"]) => void;
  removedPlacements?: ClanPlacement[];
  layoutBusy?: boolean;
  onRestorePlacement?: (placementId: string) => void;
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
  onDeleteBuilding,
  removedPlacements = [],
  layoutBusy = false,
  onRestorePlacement,
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
  const [sessionLogOpen, setSessionLogOpen] = useState(false);
  const sessionLogs = useSessionLogs();
  const { user, isLoaded } = useUser();
  const castleSelected = selected?.id === "town-hall";
  const presence = useDevicePresence(castleSelected);
  const deviceOnline = presence.online === true;
  const presenceLabel = harnessPresenceLabel(presence.online, presence.checking);
  const islandLabel = isLoaded
    ? (user?.firstName ?? user?.username ?? user?.fullName ?? "Island")
    : "Island";
  const openSessionLog = () => {
    onInteract();
    void sessionLogs.refresh();
    setSessionLogOpen(true);
  };

  const toggleSessionLog = () => {
    onInteract();
    if (!sessionLogOpen) {
      void sessionLogs.refresh();
    }
    setSessionLogOpen((open) => !open);
  };

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
        <HudButton
          label="Session history"
          active={sessionLogOpen}
          onClick={toggleSessionLog}
          icon="◫"
        />
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
            <BuildingStatusCard
              building={selected}
              runView={runView}
              deviceOnline={deviceOnline}
              runBusy={runBusy}
              onDelete={onDeleteBuilding}
              onOpenSessionLog={openSessionLog}
            />
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <SessionLogPanel
        open={sessionLogOpen}
        onClose={() => setSessionLogOpen(false)}
        logs={sessionLogs.logs}
        loading={sessionLogs.loading}
        error={sessionLogs.error}
        onRefresh={() => {
          void sessionLogs.refresh();
        }}
      />

      <AnimatePresence>
        {helpOpen ? (
          <motion.aside className="clan-help" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
            <strong>Explore the clan</strong>
            <span>Drag to pan · scroll or pinch to zoom · select a building to focus · double-click grass or press Home to reset.</span>
            <span className="clan-quality-chip">{lowQuality ? "Adaptive quality" : "High quality"}</span>
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <RemovedBuildingsTray
        removed={removedPlacements}
        busy={layoutBusy || runBusy}
        onRestore={(placementId) => onRestorePlacement?.(placementId)}
      />
    </div>
  );
}

function placementCardLabel(placement: ClanPlacement): string {
  return placementLabel(placement);
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
  const removable = canRemovePlacement(placement);
  const label = placementCardLabel(placement);

  return (
    <>
      <span className="clan-eyebrow">Island placement</span>
      <h2>{label}</h2>
      <p>
        {removable
          ? "Remove this building from your island layout."
          : "This building is fixed on the island."}
      </p>
      {removable ? (
        <button
          type="button"
          className="clan-delete-action"
          disabled={runBusy}
          onClick={() => onRemove?.()}
        >
          Delete building
        </button>
      ) : null}
    </>
  );
}

function BuildingStatusCard({
  building,
  runView,
  deviceOnline,
  runBusy,
  onDelete,
  onOpenSessionLog,
}: {
  building: SemanticBuilding;
  runView: ClanRunView;
  deviceOnline: boolean;
  runBusy: boolean;
  onDelete?: (buildingId: SemanticBuilding["id"]) => void;
  onOpenSessionLog?: () => void;
}) {
  const projection = buildingStatusFromProjection(building.id, {
    ...runView,
    deviceOnline,
  });
  const removable = canRemoveSemanticBuilding(building.id);

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
      {building.id === "session-lodge" ? (
        <button type="button" className="clan-secondary-action" onClick={() => onOpenSessionLog?.()}>
          Open session history
        </button>
      ) : null}
      {removable ? (
        <button
          type="button"
          className="clan-delete-action"
          disabled={runBusy}
          onClick={() => onDelete?.(building.id)}
        >
          Delete building
        </button>
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
