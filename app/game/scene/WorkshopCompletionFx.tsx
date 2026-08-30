"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import { Group, Mesh } from "three";

import { useClanRunViz } from "@/app/game/scene/ClanRunVizContext";
import { isClanRunBusy, type ClanRunPhase, type ClanRunSnapshot } from "@/app/lib/clan-run/types";

const SPLASH_MS = 1400;

/** Localized GSAP splash at the workshop when a build run succeeds with changes. */
export function WorkshopCompletionFx({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const { snapshot, workshopWorld } = useClanRunViz();
  const ringRef = useRef<Group>(null);
  const burstRef = useRef<Group>(null);
  const prevPhase = useRef(snapshot.phase);
  const prevRunId = useRef(snapshot.runId);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (snapshot.runId !== prevRunId.current) {
      setVisible(false);
      prevRunId.current = snapshot.runId;
      prevPhase.current = snapshot.phase;
      return;
    }

    const wasBusy = isClanRunBusy({
      ...snapshot,
      phase: prevPhase.current as ClanRunPhase,
    } satisfies ClanRunSnapshot);
    const succeeded =
      snapshot.phase === "success" &&
      prevPhase.current !== "success" &&
      snapshot.changed;

    prevPhase.current = snapshot.phase;

    if (!succeeded || !wasBusy) {
      return;
    }

    setVisible(true);
    const timer = setTimeout(() => setVisible(false), SPLASH_MS);
    return () => clearTimeout(timer);
  }, [snapshot]);

  useEffect(() => {
    if (!visible || reducedMotion) {
      return;
    }
    const ring = ringRef.current;
    const burst = burstRef.current;
    if (ring === null || burst === null) {
      return;
    }

    ring.scale.set(0.4, 0.4, 0.4);
    burst.scale.set(0.2, 0.2, 0.2);
    ring.rotation.y = 0;

    const tweens = [
      gsap.to(ring.scale, { x: 2.8, y: 2.8, z: 2.8, duration: 0.55, ease: "power2.out" }),
      gsap.to(ring.rotation, { y: Math.PI * 0.35, duration: 0.55, ease: "power1.out" }),
      gsap.to(burst.scale, { x: 3.2, y: 3.2, z: 3.2, duration: 0.7, ease: "power3.out", delay: 0.05 }),
    ];

    ring.traverse((object) => {
      if (object instanceof Mesh && object.material !== undefined) {
        const material = object.material;
        if (!Array.isArray(material) && "opacity" in material) {
          material.transparent = true;
          material.opacity = 0.85;
          tweens.push(gsap.to(material, { opacity: 0, duration: 0.45, delay: 0.35 }));
        }
      }
    });

    return () => {
      for (const tween of tweens) {
        tween.kill();
      }
    };
  }, [reducedMotion, visible]);

  if (!visible) {
    return null;
  }

  const [wx, wy, wz] = workshopWorld;

  return (
    <group position={[wx, wy + 1.2, wz]}>
      <group ref={ringRef}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.72, 32]} />
          <meshStandardMaterial color="#ffdc58" emissive="#ffd12e" emissiveIntensity={0.6} transparent opacity={0.85} />
        </mesh>
      </group>
      <group ref={burstRef}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 0.48, 24]} />
          <meshStandardMaterial color="#6bcb4a" emissive="#3d9e2a" emissiveIntensity={0.5} transparent opacity={0.7} />
        </mesh>
      </group>
    </group>
  );
}
