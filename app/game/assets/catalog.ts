import type { KenneyKitId } from "@/app/lib/visualization/kenney";
import { kenneyGlbUrl } from "@/app/lib/visualization/kenney";

export type GameAssetRole =
  | "terrain"
  | "building"
  | "prop"
  | "forest"
  | "water"
  | "tool";

export type GameAssetDefinition = {
  key: string;
  kit: KenneyKitId;
  model: string;
  role: GameAssetRole;
  defaultScale: number;
  footprint?: readonly [width: number, depth: number];
  movable: boolean;
  castsShadow: boolean;
  receivesShadow: boolean;
};

function asset<const Key extends string>(
  key: Key,
  definition: Omit<GameAssetDefinition, "key">,
) {
  return { key, ...definition } as const;
}

const building = (key: string, kit: KenneyKitId, model: string, scale = 1) =>
  asset(key, {
    kit,
    model,
    role: "building",
    defaultScale: scale,
    movable: true,
    castsShadow: true,
    receivesShadow: true,
  });

const fixed = (
  key: string,
  kit: KenneyKitId,
  model: string,
  role: GameAssetRole,
  scale = 1,
) =>
  asset(key, {
    kit,
    model,
    role,
    defaultScale: scale,
    movable: false,
    castsShadow: role !== "water",
    receivesShadow: role !== "water",
  });

export const GAME_ASSETS = {
  "townHall.wallStone": building("townHall.wallStone", "fantasyTown", "wall-block"),
  "townHall.wallDoor": building("townHall.wallDoor", "fantasyTown", "wall-door"),
  "townHall.wallWindow": building("townHall.wallWindow", "fantasyTown", "wall-window-stone"),
  "townHall.wallWood": building("townHall.wallWood", "fantasyTown", "wall-wood"),
  "townHall.wallWoodDoor": building("townHall.wallWoodDoor", "fantasyTown", "wall-wood-door"),
  "townHall.wallWoodWindow": building("townHall.wallWoodWindow", "fantasyTown", "wall-wood-window-shutters"),
  "townHall.wallWoodDetail": building("townHall.wallWoodDetail", "fantasyTown", "wall-wood-detail-cross"),
  "townHall.wallWoodCorner": building("townHall.wallWoodCorner", "fantasyTown", "wall-wood-corner"),
  "townHall.roof": building("townHall.roof", "fantasyTown", "roof"),
  "townHall.roofGable": building("townHall.roofGable", "fantasyTown", "roof-gable"),
  "townHall.roofHigh": building("townHall.roofHigh", "fantasyTown", "roof-high"),
  "townHall.roofPoint": building("townHall.roofPoint", "fantasyTown", "roof-high-point"),
  "townHall.stairs": building("townHall.stairs", "fantasyTown", "stairs-wide-stone"),
  "village.bannerRed": fixed("village.bannerRed", "fantasyTown", "banner-red", "prop"),
  "village.bannerGreen": fixed("village.bannerGreen", "fantasyTown", "banner-green", "prop"),
  "village.lantern": fixed("village.lantern", "fantasyTown", "lantern", "prop"),
  "village.fountain": fixed("village.fountain", "fantasyTown", "fountain-round-detail", "prop"),
  "village.stallRed": building("village.stallRed", "fantasyTown", "stall-red"),
  "village.stallGreen": building("village.stallGreen", "fantasyTown", "stall-green"),
  "village.stallBench": fixed("village.stallBench", "fantasyTown", "stall-bench", "prop"),
  "village.cart": fixed("village.cart", "fantasyTown", "cart", "prop"),
  "village.road": fixed("village.road", "fantasyTown", "road", "terrain"),
  "village.roadBend": fixed("village.roadBend", "fantasyTown", "road-bend", "terrain"),
  "village.roadCorner": fixed("village.roadCorner", "fantasyTown", "road-corner", "terrain"),
  "village.fence": fixed("village.fence", "fantasyTown", "fence", "prop"),
  "village.fenceGate": fixed("village.fenceGate", "fantasyTown", "fence-gate", "prop"),
  "village.windmill": building("village.windmill", "fantasyTown", "windmill"),
  "village.windmillBlade": fixed("village.windmillBlade", "fantasyTown", "blade", "prop"),
  "village.watermill": fixed("village.watermill", "fantasyTown", "watermill-wide", "building"),
  "village.waterWheel": fixed("village.waterWheel", "fantasyTown", "wheel", "prop"),

  "nature.groundGrass": fixed("nature.groundGrass", "nature", "ground_grass", "terrain"),
  "nature.pathStraight": fixed("nature.pathStraight", "nature", "ground_pathStraight", "terrain"),
  "nature.pathBend": fixed("nature.pathBend", "nature", "ground_pathBend", "terrain"),
  "nature.riverStraight": fixed("nature.riverStraight", "nature", "ground_riverStraight", "water"),
  "nature.riverBend": fixed("nature.riverBend", "nature", "ground_riverBend", "water"),
  "nature.riverCorner": fixed("nature.riverCorner", "nature", "ground_riverCorner", "water"),
  "nature.riverRocks": fixed("nature.riverRocks", "nature", "ground_riverRocks", "water"),
  "nature.bridgeWood": fixed("nature.bridgeWood", "nature", "bridge_wood", "terrain"),
  "nature.cliffBlock": fixed("nature.cliffBlock", "nature", "cliff_block_rock", "terrain"),
  "nature.cliffCorner": fixed("nature.cliffCorner", "nature", "cliff_corner_rock", "terrain"),
  "nature.waterfall": fixed("nature.waterfall", "nature", "cliff_waterfall_rock", "water"),
  "nature.waterfallTop": fixed("nature.waterfallTop", "nature", "cliff_waterfallTop_rock", "water"),
  "nature.pineDefaultA": fixed("nature.pineDefaultA", "nature", "tree_pineDefaultA", "forest"),
  "nature.pineDefaultB": fixed("nature.pineDefaultB", "nature", "tree_pineDefaultB", "forest"),
  "nature.pineRoundA": fixed("nature.pineRoundA", "nature", "tree_pineRoundA", "forest"),
  "nature.pineRoundC": fixed("nature.pineRoundC", "nature", "tree_pineRoundC", "forest"),
  "nature.pineSmallA": fixed("nature.pineSmallA", "nature", "tree_pineSmallA", "forest"),
  "nature.pineSmallC": fixed("nature.pineSmallC", "nature", "tree_pineSmallC", "forest"),
  "nature.pineTallA": fixed("nature.pineTallA", "nature", "tree_pineTallA_detailed", "forest"),
  "nature.pineTallC": fixed("nature.pineTallC", "nature", "tree_pineTallC_detailed", "forest"),
  "nature.oak": fixed("nature.oak", "nature", "tree_oak", "forest"),
  "nature.bush": fixed("nature.bush", "nature", "plant_bushDetailed", "forest"),
  "nature.rockLarge": fixed("nature.rockLarge", "nature", "rock_largeA", "prop"),
  "nature.rockSmall": fixed("nature.rockSmall", "nature", "rock_smallB", "prop"),
  "nature.flowerPurple": fixed("nature.flowerPurple", "nature", "flower_purpleA", "prop"),
  "nature.flowerYellow": fixed("nature.flowerYellow", "nature", "flower_yellowA", "prop"),
  "nature.lily": fixed("nature.lily", "nature", "lily_large", "prop"),
  "nature.log": fixed("nature.log", "nature", "log_large", "prop"),
  "nature.stump": fixed("nature.stump", "nature", "stump_old", "prop"),
  "nature.mushrooms": fixed("nature.mushrooms", "nature", "mushroom_redGroup", "prop"),
  "nature.crops": fixed("nature.crops", "nature", "crops_wheatStageB", "prop"),
  "nature.cropRows": fixed("nature.cropRows", "nature", "crops_dirtDoubleRow", "terrain"),
  "nature.obelisk": building("nature.obelisk", "nature", "statue_obelisk"),
  "nature.ring": fixed("nature.ring", "nature", "statue_ring", "prop"),

  "harbor.dock": fixed("harbor.dock", "pirate", "structure-platform-dock", "terrain"),
  "harbor.dockSmall": fixed("harbor.dockSmall", "pirate", "structure-platform-dock-small", "terrain"),
  "harbor.shipLarge": fixed("harbor.shipLarge", "pirate", "ship-large", "prop"),
  "harbor.rowboat": fixed("harbor.rowboat", "pirate", "boat-row-small", "prop"),
  "harbor.towerBaseDoor": fixed("harbor.towerBaseDoor", "pirate", "tower-base-door", "building"),
  "harbor.towerMiddleWindows": fixed("harbor.towerMiddleWindows", "pirate", "tower-middle-windows", "building"),
  "harbor.towerTop": fixed("harbor.towerTop", "pirate", "tower-top", "building"),
  "harbor.towerRoof": fixed("harbor.towerRoof", "pirate", "tower-roof", "building"),
  "harbor.flag": fixed("harbor.flag", "pirate", "flag-high-pennant", "prop"),
  "harbor.crate": fixed("harbor.crate", "pirate", "crate", "prop"),
  "harbor.barrel": fixed("harbor.barrel", "pirate", "barrel", "prop"),
  "harbor.cannon": fixed("harbor.cannon", "pirate", "cannon", "prop"),
  "harbor.castleGate": fixed("harbor.castleGate", "pirate", "castle-gate", "building"),
  "harbor.castleWall": fixed("harbor.castleWall", "pirate", "castle-wall", "building"),

  "workshop.structure": building("workshop.structure", "survival", "structure"),
  "workshop.roof": building("workshop.roof", "survival", "structure-roof"),
  "workshop.canvas": fixed("workshop.canvas", "survival", "structure-canvas", "prop"),
  "workshop.workbench": fixed("workshop.workbench", "survival", "workbench", "prop"),
  "workshop.anvil": fixed("workshop.anvil", "survival", "workbench-anvil", "prop"),
  "workshop.grinder": fixed("workshop.grinder", "survival", "workbench-grind", "prop"),
  "forge.structure": building("forge.structure", "survival", "structure-metal"),
  "forge.roof": building("forge.roof", "survival", "structure-metal-roof"),
  "forge.wall": building("forge.wall", "survival", "structure-metal-wall"),
  "camp.tent": building("camp.tent", "survival", "tent"),
  "camp.fire": fixed("camp.fire", "survival", "campfire-pit", "prop"),
  "tool.hammer": fixed("tool.hammer", "survival", "tool-hammer", "tool"),
  "workshop.planks": fixed("workshop.planks", "survival", "resource-planks", "prop"),
  "workshop.stone": fixed("workshop.stone", "survival", "resource-stone", "prop"),
} as const;

export type GameAssetKey = keyof typeof GAME_ASSETS;

export function getGameAsset(key: GameAssetKey): GameAssetDefinition {
  return GAME_ASSETS[key];
}

export function gameAssetUrl(key: GameAssetKey): string {
  const definition = getGameAsset(key);
  return kenneyGlbUrl(definition.kit, definition.model);
}

export const CORE_GAME_ASSET_KEYS = [
  "townHall.wallStone",
  "townHall.wallWood",
  "townHall.roofHigh",
  "nature.pineDefaultA",
  "nature.pineTallA",
  "nature.riverStraight",
  "nature.bridgeWood",
  "harbor.shipLarge",
  "harbor.dock",
  "workshop.structure",
  "forge.structure",
] as const satisfies readonly GameAssetKey[];
