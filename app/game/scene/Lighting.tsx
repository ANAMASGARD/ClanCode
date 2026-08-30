"use client";

import { ContactShadows } from "@react-three/drei";

export function Lighting({ lowQuality }: { lowQuality: boolean }) {
  return (
    <>
      <color attach="background" args={["#2f7a3d"]} />
      <hemisphereLight color="#fff4dc" groundColor="#3d8f48" intensity={1.45} />
      <ambientLight intensity={0.78} />
      <directionalLight
        castShadow
        color="#ffe8b8"
        intensity={1.85}
        position={[-14, 42, 18]}
        shadow-mapSize-width={lowQuality ? 1024 : 2048}
        shadow-mapSize-height={lowQuality ? 1024 : 2048}
        shadow-camera-left={-42}
        shadow-camera-right={42}
        shadow-camera-top={42}
        shadow-camera-bottom={-42}
        shadow-bias={-0.00015}
      />
      {!lowQuality ? (
        <ContactShadows
          position={[0, 0.93, 0]}
          opacity={0.18}
          scale={56}
          blur={2.2}
          far={12}
          frames={1}
        />
      ) : null}
    </>
  );
}
