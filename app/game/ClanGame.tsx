"use client";

import { Html, useProgress } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useSearchParams } from "next/navigation";
import { Component, Suspense, useEffect, useMemo, useRef, useState, type ErrorInfo, type ReactNode } from "react";
import { ACESFilmicToneMapping, PCFShadowMap, SRGBColorSpace } from "three";
import { useClanAudio } from "./audio/useClanAudio";
import { GameHud } from "./hud/GameHud";
import { ClanScene } from "./scene/ClanScene";
import { DEFAULT_CLAN_LAYOUT, type SemanticBuilding, type SemanticBuildingId } from "./state/default-layout";

export function ClanGame() {
  const searchParams = useSearchParams();
  const debug = process.env.NODE_ENV !== "production" && searchParams.get("debugAssets") === "1";
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
            gl.toneMappingExposure = 0.9;
            gl.shadowMap.type = PCFShadowMap;
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
            {debug ? <SceneDebug /> : null}
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

function SceneDebug() {
  const gl = useThree((state) => state.gl);
  const output = useRef<HTMLDivElement>(null);
  const frames = useRef(0);
  useFrame(() => {
    frames.current += 1;
    if (frames.current % 30 === 0 && output.current) {
      output.current.textContent = `calls ${gl.info.render.calls} · triangles ${gl.info.render.triangles} · objects ${gl.info.memory.geometries}`;
    }
  });
  return (
    <>
      <gridHelper args={[56, 56, "#ffe28a", "#476f63"]} position={[0, 1.02, 0]} />
      <Html fullscreen style={{ pointerEvents: "none" }}>
        <div ref={output} className="clan-debug-readout">debug scene</div>
      </Html>
    </>
  );
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
