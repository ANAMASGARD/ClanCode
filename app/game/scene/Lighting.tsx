"use client";

import { ContactShadows } from "@react-three/drei";

export function Lighting({ lowQuality }: { lowQuality: boolean }) {
  return (
    <>
      <hemisphereLight color="#fff2d2" groundColor="#315f57" intensity={1.05} />
      <ambientLight intensity={0.58} />
      <directionalLight
        castShadow
        color="#ffdf9d"
        intensity={1.65}
        position={[-22, 34, 18]}
        shadow-mapSize-width={lowQuality ? 1024 : 2048}
        shadow-mapSize-height={lowQuality ? 1024 : 2048}
        shadow-camera-left={-36}
        shadow-camera-right={36}
        shadow-camera-top={34}
        shadow-camera-bottom={-34}
        shadow-bias={-0.00025}
      />
      {!lowQuality ? (
        <ContactShadows position={[0, 0.93, 0]} opacity={0.32} scale={42} blur={2.2} far={12} frames={1} />
      ) : null}
      <fog attach="fog" args={["#9fd0c7", 88, 145]} />
    </>
  );
}
