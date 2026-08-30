"use client";

import { useGLTF } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import {
  Box3,
  Color,
  Group,
  InstancedMesh,
  Material,
  Matrix4,
  Mesh,
  Quaternion,
  Vector3,
} from "three";
import {
  gameAssetUrl,
  getGameAsset,
  type GameAssetKey,
} from "@/app/game/assets/catalog";

export type InstancePlacement = {
  position: readonly [number, number, number];
  rotation: number;
  scale: number;
};

export type AssetTint = {
  color: string;
  amount: number;
};

/** Warm-green canopy tint — deliberate art choice, never mutates the GLTF cache. */
export const CANOPY_WARM_TINT: AssetTint = { color: "#9db86a", amount: 0.16 };

/** Reference-medium blue tint for Kenney water tiles. */
export const WATER_BLUE_TINT: AssetTint = { color: "#3f9fd4", amount: 0.38 };

type InstancedAssetProps = {
  assetKey: GameAssetKey;
  instances: InstancePlacement[];
  castShadow?: boolean;
  receiveShadow?: boolean;
  tint?: AssetTint | null;
};

type TemplateMesh = {
  geometry: Mesh["geometry"];
  localMatrix: Matrix4;
  material: Material | Material[];
};

function cloneMaterial(material: Material, tint: AssetTint | null | undefined): Material {
  const clone = material.clone();
  if (tint && "color" in clone && clone.color instanceof Color) {
    clone.color.lerp(new Color(tint.color), tint.amount);
  }
  return clone;
}

function cloneSceneWithMaterials(source: Group, tint: AssetTint | null | undefined): Group {
  const clone = source.clone(true) as Group;
  clone.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    if (Array.isArray(object.material)) {
      object.material = object.material.map((material) => cloneMaterial(material, tint));
    } else if (object.material) {
      object.material = cloneMaterial(object.material, tint);
    }
  });
  return clone;
}

function applyPivot(
  clone: Group,
  pivotMode: "preserve-origin" | "ground-origin" | "ground-center" | "custom",
  pivotOffset: readonly [number, number, number],
): Group {
  if (pivotMode === "preserve-origin") {
    clone.position.set(pivotOffset[0], pivotOffset[1], pivotOffset[2]);
    return clone;
  }

  const bounds = new Box3().setFromObject(clone);
  const center = bounds.getCenter(new Vector3());
  if (pivotMode === "ground-origin") {
    clone.position.set(
      pivotOffset[0],
      -bounds.min.y + pivotOffset[1],
      pivotOffset[2],
    );
    return clone;
  }
  if (pivotMode === "ground-center") {
    clone.position.set(
      -center.x + pivotOffset[0],
      -bounds.min.y + pivotOffset[1],
      -center.z + pivotOffset[2],
    );
    return clone;
  }

  clone.position.set(
    -center.x + pivotOffset[0],
    -center.y + pivotOffset[1],
    -center.z + pivotOffset[2],
  );
  return clone;
}

function extractTemplateMeshes(
  scene: Group,
  definition: ReturnType<typeof getGameAsset>,
  tint: AssetTint | null | undefined,
): TemplateMesh[] {
  const normalized = applyPivot(
    cloneSceneWithMaterials(scene, tint),
    definition.pivotMode,
    definition.pivotOffset,
  );
  normalized.updateMatrixWorld(true);
  const rootInverse = new Matrix4().copy(normalized.matrixWorld).invert();
  const meshes: TemplateMesh[] = [];
  normalized.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    object.updateWorldMatrix(true, false);
    const localMatrix = new Matrix4().multiplyMatrices(rootInverse, object.matrixWorld);
    meshes.push({
      geometry: object.geometry,
      localMatrix,
      material: object.material,
    });
  });
  return meshes;
}

function InstancedAssetMesh({
  template,
  instances,
  castShadow,
  receiveShadow,
  baseRotationY,
  uniformScale,
}: {
  template: TemplateMesh;
  instances: InstancePlacement[];
  castShadow: boolean;
  receiveShadow: boolean;
  baseRotationY: number;
  uniformScale: number;
}) {
  const ref = useRef<InstancedMesh>(null);
  const placementMatrix = useMemo(() => new Matrix4(), []);
  const rotationMatrix = useMemo(() => new Matrix4(), []);
  const scaleVector = useMemo(() => new Vector3(), []);
  const quaternion = useMemo(() => new Quaternion(), []);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh || instances.length === 0) return;

    for (let index = 0; index < instances.length; index += 1) {
      const instance = instances[index];
      const scalar = uniformScale * instance.scale;
      quaternion.setFromAxisAngle(new Vector3(0, 1, 0), instance.rotation + baseRotationY);
      scaleVector.set(scalar, scalar, scalar);
      placementMatrix.compose(
        new Vector3(instance.position[0], instance.position[1], instance.position[2]),
        quaternion,
        scaleVector,
      );
      rotationMatrix.multiplyMatrices(placementMatrix, template.localMatrix);
      mesh.setMatrixAt(index, rotationMatrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [baseRotationY, instances, placementMatrix, quaternion, rotationMatrix, scaleVector, template.localMatrix, uniformScale]);

  if (instances.length === 0) return null;

  return (
    <instancedMesh
      ref={ref}
      args={[template.geometry, template.material, instances.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      frustumCulled
      raycast={() => undefined}
    />
  );
}

export function InstancedAsset({
  assetKey,
  instances,
  castShadow = false,
  receiveShadow = true,
  tint = null,
}: InstancedAssetProps) {
  const definition = getGameAsset(assetKey);
  const { scene } = useGLTF(gameAssetUrl(assetKey));
  const baseRotation = definition.baseRotation ?? [0, 0, 0];

  const templates = useMemo(
    () => extractTemplateMeshes(scene as Group, definition, tint),
    [definition, scene, tint],
  );

  if (instances.length === 0) return null;

  return (
    <group>
      {templates.map((template, index) => (
        <InstancedAssetMesh
          key={`${assetKey}:${index}`}
          template={template}
          instances={instances}
          castShadow={castShadow}
          receiveShadow={receiveShadow}
          baseRotationY={baseRotation[1]}
          uniformScale={definition.uniformScale}
        />
      ))}
    </group>
  );
}
