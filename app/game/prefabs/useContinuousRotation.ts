"use client";

import gsap from "gsap";
import { useEffect, type RefObject } from "react";
import { Group } from "three";

export function useContinuousRotation(
  target: RefObject<Group | null>,
  reducedMotion: boolean,
  duration: number,
  axis: "x" | "y" | "z" = "x",
) {
  useEffect(() => {
    const group = target.current;
    if (!group || reducedMotion) return;
    const prop = axis === "x" ? "x" : axis === "y" ? "y" : "z";
    const tween = gsap.to(group.rotation, {
      [prop]: `+=${Math.PI * 2}`,
      duration,
      ease: "none",
      repeat: -1,
    });
    return () => {
      tween.kill();
    };
  }, [axis, duration, reducedMotion, target]);
}
