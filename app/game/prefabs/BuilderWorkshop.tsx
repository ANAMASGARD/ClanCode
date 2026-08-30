"use client";

import gsap from "gsap";
import { useEffect, useMemo, useRef } from "react";
import { Group } from "three";

import { AssetModel } from "@/app/game/scene/AssetModel";
import { useClanRunViz } from "@/app/game/scene/ClanRunVizContext";
import { constructionSiteVisible } from "@/app/game/state/construction-site";
import {
  modulesForStoreys,
  roofModuleIndices,
  type WorkshopModule,
} from "@/app/game/state/workshop-growth";

/** Semantic Builder Workshop. Storeys come from the run snapshot, never GSAP. */
export function BuilderWorkshop({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const { snapshot } = useClanRunViz();
  const bodyRef = useRef<Group>(null);
  const roofRef = useRef<Group>(null);
  const previousStoreys = useRef(snapshot.storeys);
  const modules = modulesForStoreys(snapshot.storeys);
  const roofIndices = useMemo(() => new Set(roofModuleIndices(snapshot.storeys)), [snapshot.storeys]);

  const { bodyModules, roofModules } = useMemo(() => {
    const body: WorkshopModule[] = [];
    const roof: WorkshopModule[] = [];
    modules.forEach((module, index) => {
      if (roofIndices.has(index)) {
        roof.push(module);
      } else {
        body.push(module);
      }
    });
    return { bodyModules: body, roofModules: roof };
  }, [modules, roofIndices]);

  useEffect(() => {
    const grew = snapshot.storeys > previousStoreys.current;
    previousStoreys.current = snapshot.storeys;
    if (!grew || reducedMotion) {
      return;
    }

    const body = bodyRef.current;
    const roof = roofRef.current;
    if (body !== null) {
      body.position.y = 0.35;
      gsap.to(body.position, { y: 0, duration: 0.45, ease: "power2.out" });
    }
    if (roof !== null) {
      roof.position.y = 0.65;
      gsap.to(roof.position, { y: 0, duration: 0.55, ease: "power2.out", delay: 0.08 });
    }
  }, [reducedMotion, snapshot.storeys]);

  if (constructionSiteVisible(snapshot)) {
    return null;
  }

  return (
    <group>
      <group ref={bodyRef}>
        {bodyModules.map((module, index) => (
          <AssetModel
            key={`body-${module.assetKey}-${String(index)}`}
            assetKey={module.assetKey}
            position={module.position}
            rotation={module.rotation}
            scale={module.scale}
          />
        ))}
      </group>
      <group ref={roofRef}>
        {roofModules.map((module, index) => (
          <AssetModel
            key={`roof-${module.assetKey}-${String(index)}`}
            assetKey={module.assetKey}
            position={module.position}
            rotation={module.rotation}
            scale={module.scale}
          />
        ))}
      </group>
    </group>
  );
}
