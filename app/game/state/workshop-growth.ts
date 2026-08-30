import type { GameAssetKey } from "@/app/game/assets/catalog";

export type WorkshopStoreys = 1 | 2 | 3 | 4;

export type WorkshopModule = {
  assetKey: GameAssetKey;
  position: readonly [number, number, number];
  rotation?: readonly [number, number, number];
  scale?: number;
};

const FLOOR_HEIGHT = 1;

/** Ground floor — cream modular walls, door, and workshop props inside 4×4. */
const BASE_FLOOR: WorkshopModule[] = [
  { assetKey: "modular.block", position: [-0.55, 0, 0] },
  { assetKey: "modular.block", position: [0.55, 0, 0] },
  { assetKey: "modular.corner", position: [-0.55, 0, -0.55] },
  { assetKey: "modular.corner", position: [0.55, 0, -0.55] },
  { assetKey: "modular.windows", position: [0, 0, -0.55], rotation: [0, Math.PI, 0] },
  { assetKey: "modular.door", position: [0, 0, 0.55], rotation: [0, Math.PI, 0] },
  { assetKey: "modular.windowLeft", position: [-0.55, 0, 0.15] },
  { assetKey: "modular.windowRight", position: [0.55, 0, 0.15] },
  { assetKey: "modular.detailAc", position: [0.75, 0, -0.35], scale: 0.9 },
  { assetKey: "modular.doorBrown", position: [-0.2, 0, 0.2], rotation: [0, -Math.PI / 2, 0], scale: 0.85 },
];

function upperFloor(level: number): WorkshopModule[] {
  const y = level * FLOOR_HEIGHT;
  return [
    { assetKey: "modular.block", position: [-0.55, y, 0] },
    { assetKey: "modular.block", position: [0.55, y, 0] },
    { assetKey: "modular.cornerWindow", position: [-0.55, y, -0.55] },
    { assetKey: "modular.cornerWindow", position: [0.55, y, -0.55] },
    { assetKey: "modular.windows", position: [0, y, -0.55], rotation: [0, Math.PI, 0] },
    { assetKey: "modular.windowWide", position: [0, y, 0.55], rotation: [0, 0, 0] },
  ];
}

function roofAt(storeys: WorkshopStoreys): WorkshopModule[] {
  const y = storeys * FLOOR_HEIGHT;
  if (storeys >= 4) {
    return [
      { assetKey: "modular.sampleTower", position: [0, y - 0.05, 0], scale: 0.95 },
      { assetKey: "modular.roofSlanted", position: [0, y + 0.85, 0], scale: 0.9 },
    ];
  }
  if (storeys === 3) {
    return [
      { assetKey: "modular.roofGable", position: [0, y, 0], scale: 0.95 },
      { assetKey: "modular.roofFlatDetail", position: [0.45, y + 0.05, -0.35], scale: 0.85 },
    ];
  }
  return [{ assetKey: "modular.roofFlat", position: [0, y, 0], scale: 0.95 }];
}

/** Pure module list for the Builder Workshop. Footprint stays inside 4×4. */
export function modulesForStoreys(storeys: WorkshopStoreys): WorkshopModule[] {
  const modules: WorkshopModule[] = [...BASE_FLOOR];
  if (storeys >= 2) {
    modules.push(...upperFloor(1));
  }
  if (storeys >= 3) {
    modules.push(...upperFloor(2));
  }
  if (storeys >= 4) {
    modules.push(...upperFloor(3));
  }
  modules.push(...roofAt(storeys));
  return modules;
}

export function workshopFootprint(): readonly [number, number] {
  return [4, 4];
}

export function roofModuleIndices(storeys: WorkshopStoreys): number[] {
  const modules = modulesForStoreys(storeys);
  const roofKeys = new Set([
    "modular.roofFlat",
    "modular.roofGable",
    "modular.roofSlanted",
    "modular.sampleTower",
    "modular.roofFlatDetail",
  ]);
  return modules
    .map((module, index) => (roofKeys.has(module.assetKey) ? index : -1))
    .filter((index) => index >= 0);
}
