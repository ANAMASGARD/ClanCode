"use client";

import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { AnimationAction, Group, Mesh } from "three";
import {
  gameAssetUrl,
  getGameAsset,
  type GameAssetKey,
} from "@/app/game/assets/catalog";
import { GROUND_Y } from "@/app/game/state/tile";
import { mulberry32 } from "@/app/game/state/seeded-random";
import type { ClanPlacement } from "@/app/game/state/clan-layout";
import {
  createVillagers,
  isWalkableOnLayout,
  pickWanderTargetOnLayout,
  VILLAGER_COUNT,
  VILLAGER_MODEL_KEYS,
  VILLAGER_SEED,
  type VillagerSeed,
} from "@/app/game/state/villager-wander";

const ARRIVE_RADIUS = 0.6;
const TURN_RATE = 6;
const PAUSE_CHANCE = 0.35;
const PAUSE_SECONDS = 2.4;

/** Kenney blocky villagers wandering the clan at random. Presentation only. */
export function Villagers({
  layout,
  reducedMotion,
}: {
  layout: readonly ClanPlacement[];
  reducedMotion: boolean;
}) {
  const villagers = useMemo(
    () => createVillagers(layout, VILLAGER_SEED, VILLAGER_COUNT),
    [layout],
  );

  return (
    <group>
      {villagers.map((villager) => (
        <Villager key={villager.id} layout={layout} villager={villager} reducedMotion={reducedMotion} />
      ))}
    </group>
  );
}

type WanderState = {
  x: number;
  z: number;
  targetX: number;
  targetZ: number;
  heading: number;
  pause: number;
  random: () => number;
};

function Villager({
  layout,
  villager,
  reducedMotion,
}: {
  layout: readonly ClanPlacement[];
  villager: VillagerSeed;
  reducedMotion: boolean;
}) {
  const group = useRef<Group>(null);
  const definition = getGameAsset(villager.assetKey);
  const { scene, animations } = useGLTF(gameAssetUrl(villager.assetKey));

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

  const state = useRef<WanderState>({
    x: villager.x,
    z: villager.z,
    targetX: villager.x,
    targetZ: villager.z,
    heading: 0,
    pause: 0,
    random: mulberry32(villager.seed),
  });

  useEffect(() => {
    const walk = actions.walk;
    const idle = actions.idle;
    walk?.reset().play();
    idle?.reset().play();
    walk?.setEffectiveWeight(reducedMotion ? 0 : 1);
    idle?.setEffectiveWeight(reducedMotion ? 1 : 0);
    return () => {
      walk?.stop();
      idle?.stop();
    };
  }, [actions, reducedMotion]);

  useEffect(() => {
    const current = state.current;
    const target = pickWanderTargetOnLayout(layout, current.random, current.x, current.z);
    current.targetX = target.x;
    current.targetZ = target.z;
  }, [layout]);

  useFrame((_, delta) => {
    const node = group.current;
    const current = state.current;
    if (!node || reducedMotion) return;

    const step = Math.min(delta, 0.1);

    if (current.pause > 0) {
      current.pause -= step;
      setActionWeights(actions, 0, step);
      return;
    }

    const dx = current.targetX - current.x;
    const dz = current.targetZ - current.z;
    const distance = Math.hypot(dx, dz);

    if (distance < ARRIVE_RADIUS) {
      const target = pickWanderTargetOnLayout(layout, current.random, current.x, current.z);
      current.targetX = target.x;
      current.targetZ = target.z;
      if (current.random() < PAUSE_CHANCE) {
        current.pause = PAUSE_SECONDS * current.random();
      }
      return;
    }

    const travel = villager.speed * step;
    const nextX = current.x + (dx / distance) * travel;
    const nextZ = current.z + (dz / distance) * travel;

    // Steer away instead of walking through a building.
    if (!isWalkableOnLayout(layout, nextX, nextZ)) {
      const target = pickWanderTargetOnLayout(layout, current.random, current.x, current.z);
      current.targetX = target.x;
      current.targetZ = target.z;
      return;
    }

    current.x = nextX;
    current.z = nextZ;

    const desired = Math.atan2(dx, dz);
    current.heading += shortestAngle(current.heading, desired) * Math.min(1, TURN_RATE * step);

    node.position.set(current.x, GROUND_Y, current.z);
    node.rotation.y = current.heading;
    setActionWeights(actions, 1, step);
  });

  return (
    <group
      ref={group}
      position={[villager.x, GROUND_Y, villager.z]}
      scale={definition.uniformScale}
    >
      <primitive object={model} />
    </group>
  );
}

type VillagerActions = ReturnType<typeof useAnimations>["actions"];

/** Blend walk/idle imperatively so movement never triggers a React re-render. */
function setActionWeights(actions: VillagerActions, walkTarget: number, step: number) {
  const blend = Math.min(1, step * 8);
  blendWeight(actions.walk, walkTarget, blend);
  blendWeight(actions.idle, 1 - walkTarget, blend);
}

function blendWeight(action: AnimationAction | null, target: number, blend: number) {
  if (!action) return;
  const current = action.getEffectiveWeight();
  action.setEffectiveWeight(current + (target - current) * blend);
}

function shortestAngle(from: number, to: number): number {
  let delta = (to - from) % (Math.PI * 2);
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}

for (const key of VILLAGER_MODEL_KEYS as readonly GameAssetKey[]) {
  useGLTF.preload(gameAssetUrl(key));
}
