"use client";

import { ContactShadows } from "@react-three/drei";

export function Lighting({ lowQuality }: { lowQuality: boolean }) {
  return (
    <>
      <color attach="background" args={["#8fd4eb"]} />
      <hemisphereLight color="#fff6dc" groundColor="#3d8f52" intensity={1.2} />
      <ambientLight intensity={0.72} />
      <directionalLight
        castShadow
        color="#ffe8b0"
        intensity={1.85}
        position={[-18, 38, 22]}
        shadow-mapSize-width={lowQuality ? 1024 : 2048}
        shadow-mapSize-height={lowQuality ? 1024 : 2048}
        shadow-camera-left={-38}
        shadow-camera-right={38}
        shadow-camera-top={36}
        shadow-camera-bottom={-36}
        shadow-bias={-0.0002}
      />
      {!lowQuality ? (
        <ContactShadows
          position={[0, 0.93, 0]}
          opacity={0.28}
          scale={48}
          blur={2.4}
          far={14}
          frames={1}
        />
      ) : null}
      <fog attach="fog" args={["#b8e8f4", 105, 175]} />
    </>
  );
}
