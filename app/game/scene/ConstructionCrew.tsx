"use client";

import { useAnimations, useGLTF } from "@react-three/drei";
import gsap from "gsap";
import { useEffect, useMemo, useRef } from "react";
import { Group, Mesh } from "three";

import { gameAssetUrl, getGameAsset, type GameAssetKey } from "@/app/game/assets/catalog";
import { AssetModel } from "@/app/game/scene/AssetModel";
import { useClanRunViz } from "@/app/game/scene/ClanRunVizContext";
import { crewActivityFromSnapshot, type CrewActivity } from "@/app/game/state/construction-site";
import { GROUND_Y } from "@/app/game/state/tile";

export { crewActivityFromSnapshot };

const CREW: ReadonlyArray<{ id: string; assetKey: GameAssetKey; offset: readonly [number, number] }> = [
  { id: "builder-b", assetKey: "villager.b", offset: [-1.6, 1.4] },
  { id: "builder-e", assetKey: "villager.e", offset: [1.8, 1.1] },
  { id: "builder-g", assetKey: "villager.g", offset: [0.2, 2.1] },
];

/** Dedicated construction crew. Movement is GSAP; these models are not wanderers. */
export function ConstructionCrew({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const { snapshot, workshopWorld } = useClanRunViz();
  const activity = crewActivityFromSnapshot(snapshot);

  return (
    <group>
      {CREW.map((member, index) => (
        <CrewMember
          key={member.id}
          member={member}
          activity={activity}
          workshopWorld={workshopWorld}
          reducedMotion={reducedMotion}
          stagger={index * 0.18}
        />
      ))}
    </group>
  );
}

function CrewMember({
  member,
  activity,
  workshopWorld,
  reducedMotion,
  stagger,
}: {
  member: (typeof CREW)[number];
  activity: CrewActivity;
  workshopWorld: readonly [number, number, number];
  reducedMotion: boolean;
  stagger: number;
}) {
  const group = useRef<Group>(null);
  const hammer = useRef<Group>(null);
  const definition = getGameAsset(member.assetKey);
  const { scene, animations } = useGLTF(gameAssetUrl(member.assetKey));
  const model = useMemo(() => {
    const clone = scene.clone(true) as Group;
    clone.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
    });
    return clone;
  }, [scene]);
  const { actions } = useAnimations(animations, model);
  const idle = useMemo(
    () =>
      [
        workshopWorld[0] + member.offset[0] * 3.2,
        GROUND_Y,
        workshopWorld[2] + member.offset[1] * 3.2,
      ] as const,
    [member.offset, workshopWorld],
  );
  const work = useMemo(
    () =>
      [
        workshopWorld[0] + member.offset[0],
        GROUND_Y,
        workshopWorld[2] + member.offset[1],
      ] as const,
    [member.offset, workshopWorld],
  );

  useEffect(() => {
    actions.walk?.reset().play();
    actions.idle?.reset().play();
    return () => {
      actions.walk?.stop();
      actions.idle?.stop();
    };
  }, [actions]);

  useEffect(() => {
    const node = group.current;
    if (!node) return;
    const atWork = activity === "approach" || activity === "hammer" || activity === "paused" || activity === "frozen";
    const target = atWork ? work : idle;
    const walking = activity === "approach" || activity === "hammer";
    actions.walk?.setEffectiveWeight(reducedMotion || !walking ? 0 : 1);
    actions.idle?.setEffectiveWeight(reducedMotion || !walking ? 1 : 0);
    if (reducedMotion) {
      node.position.set(target[0], target[1], target[2]);
      return;
    }
    const tween = gsap.to(node.position, {
      x: target[0],
      y: target[1],
      z: target[2],
      duration: 1.15 + stagger,
      ease: "power1.inOut",
    });
    return () => {
      tween.kill();
    };
  }, [actions, activity, idle, reducedMotion, stagger, work]);

  useEffect(() => {
    const node = hammer.current;
    if (!node) return;
    if (reducedMotion || activity !== "hammer") {
      node.rotation.x = 0;
      return;
    }
    const tween = gsap.to(node.rotation, {
      x: -0.9,
      duration: 0.22,
      yoyo: true,
      repeat: -1,
      ease: "power1.inOut",
    });
    return () => {
      tween.kill();
      node.rotation.x = 0;
    };
  }, [activity, reducedMotion]);

  return (
    <group ref={group} position={[idle[0], idle[1], idle[2]]} scale={definition.uniformScale}>
      <primitive object={model} />
      <group ref={hammer} position={[0.22, 0.55, 0.18]}>
        <AssetModel assetKey="tool.hammer" scale={0.12} />
      </group>
    </group>
  );
}

for (const member of CREW) {
  useGLTF.preload(gameAssetUrl(member.assetKey));
}