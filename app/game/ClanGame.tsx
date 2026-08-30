"use client";

import { useProgress } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Component, Suspense, useCallback, useEffect, useMemo, useState, type ErrorInfo, type ReactNode } from "react";
import { ACESFilmicToneMapping, PCFSoftShadowMap, SRGBColorSpace } from "three";
import { useClanAudio } from "./audio/useClanAudio";
import { EditModeHud } from "./hud/EditModeHud";
import { GameHud } from "./hud/GameHud";
import { useClanLayout } from "./hooks/useClanLayout";
import { useClanRunProjection } from "./hooks/useClanRunProjection";
import { ClanScene } from "./scene/ClanScene";
import {
  buildSemanticBuildingsFromLayout,
  type SemanticBuilding,
  type SemanticBuildingId,
} from "./state/default-layout";
import { getPlacementId, type ClanPlacement } from "./state/clan-layout";
import {
  addPlacement,
  createDecorativePlacement,
  createPropPlacement,
  movePlacement,
} from "./state/layout-editor";
import { findShopItem, type PlacableShopItem } from "./state/placable-catalog";
import { isClanRunBusy } from "@/app/lib/clan-run/types";

export function ClanGame() {
  const [webgl] = useState(() => canUseWebGL());
  const [selected, setSelected] = useState<SemanticBuilding | null>(null);
  const [selectedPlacementId, setSelectedPlacementId] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState(0);
  const [sceneErrorState, setSceneErrorState] = useState<{ key: string; message: string } | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const [armedShopId, setArmedShopId] = useState<string | null>(null);
  const [replaceHint, setReplaceHint] = useState(false);
  const [dragging, setDragging] = useState(false);
  const { muted, interact, toggleMuted } = useClanAudio();
  const reducedMotion = useReducedMotion();
  const layoutState = useClanLayout();
  const projection = useClanRunProjection();
  const runBusy = isClanRunBusy(projection);

  const lowQuality = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return navigator.hardwareConcurrency <= 4 || window.matchMedia("(max-width: 760px)").matches;
  }, []);

  const buildings = useMemo(
    () => buildSemanticBuildingsFromLayout(layoutState.layout),
    [layoutState.layout],
  );

  const sceneFocus = useMemo((): readonly [number, number, number] | null => {
    if (layoutState.editMode) {
      return null;
    }
    return selected?.position ?? null;
  }, [layoutState.editMode, selected]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Home") {
        setSelected(null);
        setSelectedPlacementId(null);
        setResetToken((token) => token + 1);
      }
      if (event.key === "Escape") {
        if (layoutState.editMode) {
          layoutState.done();
          setShopOpen(false);
          setArmedShopId(null);
          setReplaceHint(false);
        } else {
          setSelected(null);
          setSelectedPlacementId(null);
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [layoutState]);

  const reset = () => {
    setSelected(null);
    setSelectedPlacementId(null);
    setResetToken((token) => token + 1);
  };

  const select = (building: SemanticBuilding) => {
    if (layoutState.editMode) return;
    interact();
    setSelectedPlacementId(null);
    setSelected(building);
  };

  const selectPlacement = (placementId: string) => {
    if (layoutState.editMode || runBusy) return;
    interact();
    setSelected(null);
    setSelectedPlacementId(placementId);
  };

  const handleRemoveSelectedPlacement = useCallback(async (): Promise<boolean> => {
    if (!selectedPlacementId || runBusy || layoutState.editMode) {
      return false;
    }
    const removed = await layoutState.removeAndSave(selectedPlacementId);
    if (removed) {
      setSelectedPlacementId(null);
      if (!layoutState.editMode) {
        layoutState.setEditMode(true);
      }
      setShopOpen(true);
      setReplaceHint(true);
    }
    return removed;
  }, [layoutState, runBusy, selectedPlacementId]);

  const enterEditMode = () => {
    layoutState.setEditMode(true);
    setSelected(null);
    setSelectedPlacementId(null);
    setShopOpen(false);
    setArmedShopId(null);
    setReplaceHint(false);
  };

  const handleMovePlacement = useCallback(
    (placementId: string, tileX: number, tileZ: number) => {
      layoutState.setDraft((current) => movePlacement(current, placementId, tileX, tileZ) ?? current);
    },
    [layoutState],
  );

  const handleRemove = () => {
    if (!selectedPlacementId) return;
    if (layoutState.removeFromDraft(selectedPlacementId)) {
      setSelectedPlacementId(null);
      setReplaceHint(true);
      setShopOpen(true);
    }
  };

  const handleArmShopItem = (item: PlacableShopItem) => {
    setArmedShopId(item.shopId);
    setReplaceHint(false);
  };

  const createPlacementFromShop = (item: PlacableShopItem, tileX: number, tileZ: number): ClanPlacement | null => {
    const id = crypto.randomUUID();
    if (item.kind === "prefab") {
      return createDecorativePlacement(item.prefab, tileX, tileZ, id);
    }
    return createPropPlacement(item.assetKey, tileX, tileZ, id);
  };

  const handlePickTile = (tileX: number, tileZ: number) => {
    if (!armedShopId) return;
    const item = findShopItem(armedShopId);
    if (!item) return;
    const placement = createPlacementFromShop(item, tileX, tileZ);
    if (!placement) return;
    layoutState.setDraft((current) => addPlacement(current, placement) ?? current);
    setArmedShopId(null);
    setReplaceHint(false);
  };

  const selectedPlacement = useMemo((): ClanPlacement | null => {
    if (selectedPlacementId === null) {
      return null;
    }
    return layoutState.layout.find((placement) => getPlacementId(placement) === selectedPlacementId) ?? null;
  }, [layoutState.layout, selectedPlacementId]);

  const sceneKey = `${projection.runId ?? "idle"}-${String(resetToken)}`;
  const sceneError = sceneErrorState?.key === sceneKey ? sceneErrorState.message : null;

  if (!webgl || sceneError) return <WebGLFallback error={sceneError} buildings={buildings} />;

  return (
    <main className={`clan-game-shell${layoutState.editMode ? " is-editing" : ""}${dragging ? " is-dragging" : ""}`}>
      <SceneErrorBoundary
        key={sceneKey}
        onError={(error) => setSceneErrorState({ key: sceneKey, message: error.message })}
      >
        <Canvas
          shadows="percentage"
          dpr={lowQuality ? 1 : [1, 1.5]}
          gl={{ antialias: !lowQuality, powerPreference: "high-performance", toneMapping: ACESFilmicToneMapping }}
          onCreated={({ gl }) => {
            gl.setClearColor("#3d8f48");
            gl.outputColorSpace = SRGBColorSpace;
            gl.toneMappingExposure = 1.08;
            gl.shadowMap.type = PCFSoftShadowMap;
          }}
        >
          <Suspense fallback={null}>
            <ClanScene
              layout={layoutState.layout}
              editMode={layoutState.editMode}
              selectedId={selected?.id ?? null}
              selectedPlacementId={selectedPlacementId}
              shopArmed={armedShopId !== null}
              snapshot={projection}
              onSelect={select}
              onSelectPlacement={layoutState.editMode ? setSelectedPlacementId : selectPlacement}
              onMovePlacement={handleMovePlacement}
              onPickTile={handlePickTile}
              onDragChange={setDragging}
              onReset={reset}
              focus={sceneFocus}
              resetToken={resetToken}
              lowQuality={lowQuality}
              reducedMotion={reducedMotion}
            />
          </Suspense>
        </Canvas>
      </SceneErrorBoundary>
      <SceneProgress />
      <GameHud
        buildings={buildings}
        selected={selected}
        muted={muted}
        lowQuality={lowQuality}
        editMode={layoutState.editMode}
        runBusy={runBusy}
        runView={projection}
        selectedPlacement={selectedPlacement}
        onRemovePlacement={() => {
          void handleRemoveSelectedPlacement();
        }}
        onDeleteBuilding={(buildingId) => {
          void layoutState.removeAndSave(buildingId).then((removed) => {
            if (removed) {
              setSelected(null);
              setSelectedPlacementId(null);
            }
          });
        }}
        removedPlacements={layoutState.removedPlacements}
        layoutBusy={layoutState.saving}
        onRestorePlacement={(placementId) => {
          void layoutState.restorePlacement(placementId);
        }}
        onHome={reset}
        onAudio={toggleMuted}
        onInteract={interact}
        onSelectBuilding={select}
        onToggleEditMode={enterEditMode}
        onFocusCastle={() => {
          interact();
          const castle = buildings.find((entry) => entry.id === "town-hall");
          if (castle !== undefined) {
            select(castle);
          }
        }}
        onCloseCastle={() => setSelected(null)}
      />
      {layoutState.editMode ? (
        <EditModeHud
          saving={layoutState.saving}
          error={layoutState.error}
          shopOpen={shopOpen}
          armedShopId={armedShopId}
          replaceHint={replaceHint}
          canRemove={selectedPlacementId !== null}
          onDone={layoutState.done}
          onToggleShop={() => setShopOpen((open) => !open)}
          onRemove={handleRemove}
          onArmShopItem={handleArmShopItem}
          onCloseShop={() => setShopOpen(false)}
        />
      ) : null}
    </main>
  );
}

function SceneProgress() {
  const { active, progress, item } = useProgress();
  if (!active) return null;
  return <ClanLoading label={item ? `Loading ${decodeURIComponent(item.split("/").at(-1) ?? "village")}` : "Building your clan…"} progress={progress} />;
}

function ClanLoading({ label, progress }: { label: string; progress?: number }) {
  return (
    <div className="clan-loading" role="status" aria-live="polite">
      <span className="clan-loading-sigil">CC</span>
      <strong>ClanCode</strong>
      <p>{label}</p>
      <div><i style={{ width: `${Math.max(7, progress ?? 12)}%` }} /></div>
      {progress !== undefined ? <small>{Math.round(progress)}%</small> : null}
    </div>
  );
}

function WebGLFallback({ error, buildings }: { error: string | null; buildings: readonly SemanticBuilding[] }) {
  return (
    <main className="clan-fallback">
      <span className="clan-eyebrow">3D visualization unavailable</span>
      <h1>Your clan is still here.</h1>
      <p>{error ?? "This browser or device could not start WebGL. Device controls remain available."}</p>
      <div className="clan-fallback-grid">
        {buildings.map((building) => <div key={building.id}><strong>{building.name}</strong><span>{building.purpose}</span></div>)}
      </div>
      <a href="/dashboard/devices">Open device controls</a>
    </main>
  );
}

function canUseWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return reduced;
}

class SceneErrorBoundary extends Component<{ children: ReactNode; onError: (error: Error) => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Clan scene failed", { message: error.message, componentStack: info.componentStack });
    this.props.onError(error);
  }
  render() {
    if (this.state.failed) {
      return null;
    }
    return this.props.children;
  }
}

export type { SemanticBuildingId };
