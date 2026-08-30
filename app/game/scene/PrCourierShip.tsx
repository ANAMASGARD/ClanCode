"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import { Group } from "three";

import { AssetModel } from "@/app/game/scene/AssetModel";
import { useClanRunViz } from "@/app/game/scene/ClanRunVizContext";
import { PR_COURIER_PLACEMENT } from "@/app/game/state/shore-layout";

type CourierPose = "idle" | "holding" | "loading" | "cargo" | "sailing" | "returning";

function poseFromSnapshot(deliveryStage: string, phase: string, approvalDecision: string | null): CourierPose {
  if (deliveryStage === "pr_created") return "sailing";
  if (deliveryStage === "committing") return "cargo";
  if (deliveryStage === "ready") return "loading";
  if (phase === "awaiting_approval" && approvalDecision !== "granted") return "holding";
  if (deliveryStage === "failed") return "idle";
  return "idle";
}

/** Medium ship reserved for PR delivery. Harbor ambient vessels stay untouched. */
export function PrCourierShip({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const { snapshot } = useClanRunViz();
  const group = useRef<Group>(null);
  const pose = poseFromSnapshot(snapshot.deliveryStage, snapshot.phase, snapshot.approvalDecision);
  const home = PR_COURIER_PLACEMENT.position;

  useEffect(() => {
    const node = group.current;
    if (!node) return;
    const targets: Record<CourierPose, { x: number; z: number; y: number }> = {
      idle: { x: home[0], y: home[1], z: home[2] },
      holding: { x: home[0] - 4, y: home[1], z: home[2] - 2 },
      loading: { x: home[0] + 2, y: home[1], z: home[2] - 3 },
      cargo: { x: home[0] + 2.4, y: home[1], z: home[2] - 2.4 },
      sailing: { x: home[0] + 18, y: home[1], z: home[2] + 16 },
      returning: { x: home[0], y: home[1], z: home[2] },
    };
    const target = targets[pose];
    if (reducedMotion) {
      node.position.set(target.x, target.y, target.z);
      return;
    }
    const tween = gsap.to(node.position, {
      x: target.x,
      y: target.y,
      z: target.z,
      duration: pose === "sailing" ? 4.5 : 1.4,
      ease: pose === "sailing" ? "power1.in" : "power2.inOut",
    });
    return () => {
      tween.kill();
    };
  }, [home, pose, reducedMotion]);

  useEffect(() => {
    if (pose !== "sailing" || reducedMotion || snapshot.deliveryStage !== "pr_created") {
      return;
    }
    const node = group.current;
    if (!node) return;
    const timer = window.setTimeout(() => {
      gsap.to(node.position, {
        x: home[0],
        y: home[1],
        z: home[2],
        duration: 3.2,
        ease: "power1.inOut",
      });
    }, 5200);
    return () => {
      window.clearTimeout(timer);
    };
  }, [home, pose, reducedMotion, snapshot.deliveryStage]);

  return (
    <group ref={group} position={[...home]} rotation={[0, PR_COURIER_PLACEMENT.rotation, 0]}>
      <AssetModel assetKey={PR_COURIER_PLACEMENT.assetKey} scale={PR_COURIER_PLACEMENT.scale} />
    </group>
  );
}