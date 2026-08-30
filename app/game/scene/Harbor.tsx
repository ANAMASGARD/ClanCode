"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import { DoubleSide, Group } from "three";
import { AssetModel } from "./AssetModel";
import {
  HARBOR_BEACH_TILES,
  HARBOR_PROPS,
  harborBeachPosition,
} from "@/app/game/state/harbor-layout";

type HarborProps = {
  lowQuality: boolean;
  reducedMotion: boolean;
};

export function Harbor({ lowQuality, reducedMotion }: HarborProps) {
  const shipLarge = useRef<Group>(null);
  const shipMedium = useRef<Group>(null);

  useEffect(() => {
    const large = shipLarge.current;
    const medium = shipMedium.current;
    if (reducedMotion) return;
    const tweens: gsap.core.Timeline[] = [];
    if (large) {
      const timeline = gsap.timeline({ repeat: -1, yoyo: true });
      timeline.to(large.position, { y: "-=0.22", duration: 1.9, ease: "sine.inOut" }, 0);
      timeline.to(large.rotation, { z: 0.015, duration: 2.4, ease: "sine.inOut" }, 0);
      tweens.push(timeline);
    }
    if (medium) {
      const timeline = gsap.timeline({ repeat: -1, yoyo: true, delay: 0.6 });
      timeline.to(medium.position, { y: "-=0.18", duration: 2.1, ease: "sine.inOut" }, 0);
      timeline.to(medium.rotation, { z: -0.012, duration: 2.6, ease: "sine.inOut" }, 0);
      tweens.push(timeline);
    }
    return () => {
      for (const tween of tweens) tween.kill();
    };
  }, [reducedMotion]);

  return (
    <group>
      {HARBOR_BEACH_TILES.map(({ tileX, tileZ }) => (
        <AssetModel
          key={`beach:${tileX}:${tileZ}`}
          assetKey="nature.platformBeach"
          position={harborBeachPosition(tileX, tileZ)}
          scale={0.42}
        />
      ))}
      {HARBOR_PROPS.map((prop) => {
        if (prop.id === "ship-large") {
          return (
            <group key={prop.id} ref={shipLarge} position={prop.position} rotation={[0, prop.rotation ?? 0, 0]}>
              <AssetModel assetKey={prop.assetKey} scale={prop.scale} />
            </group>
          );
        }
        if (prop.id === "ship-medium") {
          return (
            <group key={prop.id} ref={shipMedium} position={prop.position} rotation={[0, prop.rotation ?? 0, 0]}>
              <AssetModel assetKey={prop.assetKey} scale={prop.scale} />
            </group>
          );
        }
        if (prop.id.startsWith("lighthouse")) {
          return (
            <AssetModel
              key={prop.id}
              assetKey={prop.assetKey}
              position={prop.position}
              rotation={[0, prop.rotation ?? 0, 0]}
              scale={prop.scale}
            />
          );
        }
        return (
          <AssetModel
            key={prop.id}
            assetKey={prop.assetKey}
            position={prop.position}
            rotation={[0, prop.rotation ?? 0, 0]}
            scale={prop.scale}
          />
        );
      })}
      <LighthouseBeacon lowQuality={lowQuality} reducedMotion={reducedMotion} />
    </group>
  );
}

function LighthouseBeacon({
  lowQuality,
  reducedMotion,
}: {
  lowQuality: boolean;
  reducedMotion: boolean;
}) {
  const beacon = useRef<Group>(null);
  useEffect(() => {
    const light = beacon.current;
    if (!light || reducedMotion || lowQuality) return;
    const tween = gsap.to(light.rotation, {
      y: `+=${Math.PI * 2}`,
      duration: 18,
      ease: "none",
      repeat: -1,
    });
    return () => {
      tween.kill();
    };
  }, [lowQuality, reducedMotion]);

  return (
    <group position={[-26, 0.94, 2]}>
      <AssetModel assetKey="village.lantern" position={[0, 5.2, 0]} scale={1.4} />
      <pointLight color="#ffcf72" intensity={lowQuality ? 5 : 11} distance={20} position={[0, 5.4, 0]} />
      <group ref={beacon} position={[0, 5.5, 0]}>
        <mesh position={[4.5, 0, 0]} rotation-z={-Math.PI / 2}>
          <coneGeometry args={[1.1, 10, lowQuality ? 8 : 18, 1, true]} />
          <meshBasicMaterial color="#ffe7a0" transparent opacity={0.14} depthWrite={false} side={DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}
