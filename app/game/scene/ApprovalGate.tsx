"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import { Group } from "three";

import { AssetModel } from "@/app/game/scene/AssetModel";
import { useClanRunViz } from "@/app/game/scene/ClanRunVizContext";

/** Harbor gate shell plus a lowerable metal leaf driven by real approval events. */
export function ApprovalGate({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const { snapshot } = useClanRunViz();
  const leaf = useRef<Group>(null);
  const closed =
    snapshot.phase === "awaiting_approval" || snapshot.approvalDecision === "denied";

  useEffect(() => {
    const node = leaf.current;
    if (!node) return;
    const y = closed ? 0 : 2.4;
    if (reducedMotion) {
      node.position.y = y;
      return;
    }
    const tween = gsap.to(node.position, {
      y,
      duration: 0.7,
      ease: closed ? "power2.in" : "power2.out",
    });
    return () => {
      tween.kill();
    };
  }, [closed, reducedMotion]);

  return (
    <group>
      <AssetModel assetKey="harbor.castleGate" />
      <group ref={leaf} position={[0, closed ? 0 : 2.4, 0.15]}>
        <AssetModel assetKey="castle.metalGate" scale={0.85} />
      </group>
      <AssetModel
        assetKey={snapshot.approvalDecision === "denied" ? "village.bannerRed" : "village.bannerGreen"}
        position={[0, 3.6, 0.4]}
        scale={1.2}
      />
    </group>
  );
}