"use client";

import { useProgress } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Component, Suspense, useEffect, useMemo, useState, type ErrorInfo, type ReactNode } from "react";
import { ACESFilmicToneMapping, PCFSoftShadowMap, SRGBColorSpace } from "three";
import { useClanAudio } from "./audio/useClanAudio";
import { GameHud } from "./hud/GameHud";
import { ClanScene } from "./scene/ClanScene";
import { DEFAULT_CLAN_LAYOUT, type SemanticBuilding, type SemanticBuildingId } from "./state/default-layout";

export function ClanGame() {
  const [webgl] = useState(() => canUseWebGL());
  const [selected, setSelected] = useState<SemanticBuilding | null>(null);
  const [resetToken, setResetToken] = useState(0);
  const [sceneError, setSceneError] = useState<string | null>(null);
  const { muted, interact, toggleMuted } = useClanAudio();
  const reducedMotion = useReducedMotion();
  const lowQuality = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return navigator.hardwareConcurrency <= 4 || window.matchMedia("(max-width: 760px)").matches;
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Home") {
        setSelected(null);
        setResetToken((token) => token + 1);
      }
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const reset = () => {
    setSelected(null);
    setResetToken((token) => token + 1);
  };
  const select = (building: SemanticBuilding) => {
    interact();
    setSelected(building);
  };

  if (!webgl || sceneError) return <WebGLFallback error={sceneError} />;

  return (
    <main className="clan-game-shell">
      <SceneErrorBoundary onError={(error) => setSceneError(error.message)}>
        <Canvas
          shadows="percentage"
          dpr={lowQuality ? 1 : [1, 1.5]}
          gl={{ antialias: !lowQuality, powerPreference: "high-performance", toneMapping: ACESFilmicToneMapping }}
          onCreated={({ gl }) => {
            gl.outputColorSpace = SRGBColorSpace;
            gl.toneMappingExposure = 1.08;
            gl.shadowMap.type = PCFSoftShadowMap;
          }}
        >
          <Suspense fallback={null}>
            <ClanScene
              selectedId={selected?.id ?? null}
              onSelect={select}
              onReset={reset}
              focus={selected?.position ?? null}
              resetToken={resetToken}
              lowQuality={lowQuality}
              reducedMotion={reducedMotion}
            />
          </Suspense>
        </Canvas>
      </SceneErrorBoundary>
      <SceneProgress />
      <GameHud
        buildings={DEFAULT_CLAN_LAYOUT}
        selected={selected}
        muted={muted}
        lowQuality={lowQuality}
        onHome={reset}
        onAudio={toggleMuted}
        onInteract={interact}
        onSelectBuilding={select}
      />
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

function WebGLFallback({ error }: { error: string | null }) {
  return (
    <main className="clan-fallback">
      <span className="clan-eyebrow">3D visualization unavailable</span>
      <h1>Your clan is still here.</h1>
      <p>{error ?? "This browser or device could not start WebGL. Device controls remain available."}</p>
      <div className="clan-fallback-grid">
        {DEFAULT_CLAN_LAYOUT.map((building) => <div key={building.id}><strong>{building.name}</strong><span>{building.purpose}</span></div>)}
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
  render() { return this.state.failed ? null : this.props.children; }
}

export type { SemanticBuildingId };
