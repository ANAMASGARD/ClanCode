"use client";

import { OrbitControls, OrthographicCamera } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import { MOUSE, TOUCH, Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  CAMERA_DEFAULT_ZOOM,
  CAMERA_MAX_ZOOM,
  CAMERA_MIN_ZOOM,
  CAMERA_PAN_HALF_X,
  CAMERA_PAN_HALF_Z_NEG,
  CAMERA_PAN_HALF_Z_POS,
  PLOT_HALF,
} from "@/app/game/state/island";

const OVERVIEW_POSITION = new Vector3(42, 48, 42);
const MIN_TARGET = new Vector3(-CAMERA_PAN_HALF_X, 0, -CAMERA_PAN_HALF_Z_NEG);
const MAX_TARGET = new Vector3(CAMERA_PAN_HALF_X, 0, CAMERA_PAN_HALF_Z_POS);

export function CameraRig({
  focus,
  resetToken,
}: {
  focus: readonly [number, number, number] | null;
  resetToken: number;
}) {
  const controls = useRef<OrbitControlsImpl>(null);
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    const orbit = controls.current;
    if (!orbit) return;
    const target = focus ? new Vector3(...focus) : new Vector3(0, 0, 0);
    const offset = focus ? new Vector3(18, 22, 18) : OVERVIEW_POSITION.clone();
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 0.85;
    const cameraTween = gsap.to(camera.position, {
      x: target.x + offset.x,
      y: target.y + offset.y,
      z: target.z + offset.z,
      duration,
      ease: "power3.inOut",
      onUpdate: () => camera.updateProjectionMatrix(),
    });
    const targetTween = gsap.to(orbit.target, {
      x: target.x,
      y: 0,
      z: target.z,
      duration,
      ease: "power3.inOut",
      onUpdate: () => orbit.update(),
    });
    return () => {
      cameraTween.kill();
      targetTween.kill();
    };
  }, [camera, focus, resetToken]);

  useFrame(() => {
    const orbit = controls.current;
    if (!orbit) return;
    orbit.target.clamp(MIN_TARGET, MAX_TARGET);
  });

  return (
    <>
      <OrthographicCamera
        makeDefault
        position={OVERVIEW_POSITION.toArray()}
        zoom={CAMERA_DEFAULT_ZOOM}
        near={0.1}
        far={260}
      />
      <OrbitControls
        ref={controls}
        makeDefault
        enableRotate={false}
        enableDamping
        dampingFactor={0.08}
        minZoom={CAMERA_MIN_ZOOM}
        maxZoom={CAMERA_MAX_ZOOM}
        zoomToCursor
        screenSpacePanning={false}
        mouseButtons={{ LEFT: MOUSE.PAN, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN }}
        touches={{ ONE: TOUCH.PAN, TWO: TOUCH.DOLLY_PAN }}
      />
    </>
  );
}

export { PLOT_HALF };
