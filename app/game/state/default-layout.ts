import { placementWorldPosition, type ClanPlacement } from "./clan-layout";
import { SEMANTIC_PLACEMENTS } from "./semantic-layout";

export type SemanticBuildingId =
  | "town-hall"
  | "search-tower"
  | "builder-workshop"
  | "validation-forge"
  | "session-lodge"
  | "model-shrine"
  | "approval-gate"
  | "test-camp"
  | "market"
  | "windmill"
  | "watermill"
  | "farm";

export type SemanticBuilding = {
  id: SemanticBuildingId;
  name: string;
  purpose: string;
  status: string;
  position: readonly [number, number, number];
  movable: boolean;
};

const METADATA: Record<
  SemanticBuildingId,
  Omit<SemanticBuilding, "id" | "position">
> = {
  "town-hall": { name: "Clan Castle", purpose: "Repository root and clan command", status: "Ready", movable: true },
  "search-tower": { name: "Search Tower", purpose: "Read, list, grep and glob", status: "Watching", movable: true },
  "builder-workshop": { name: "Builder Workshop", purpose: "Create, write and patch", status: "Idle", movable: true },
  "validation-forge": { name: "Validation Forge", purpose: "Tests, typecheck and build", status: "Banked", movable: true },
  "session-lodge": { name: "Session Lodge", purpose: "Sessions, resume and handoff", status: "Quiet", movable: true },
  "model-shrine": { name: "Model Shrine", purpose: "Model selection and agent identity", status: "Attuned", movable: true },
  "approval-gate": { name: "Approval Gate", purpose: "Human checkpoint for sensitive actions", status: "Closed", movable: false },
  "test-camp": { name: "Test Camp", purpose: "Temporary run and worktree activity", status: "Standing by", movable: true },
  market: { name: "Tool Market", purpose: "Available tools and capabilities", status: "Open", movable: true },
  windmill: { name: "Windmill", purpose: "Background and idle work", status: "Turning", movable: true },
  watermill: { name: "Event Watermill", purpose: "Structured event processing flow", status: "Flowing", movable: false },
  farm: { name: "Backlog Farm", purpose: "Queued and planned work", status: "Growing", movable: false },
};

export const DEFAULT_CLAN_LAYOUT = buildSemanticBuildingsFromLayout(
  SEMANTIC_PLACEMENTS.map((placement) => ({
    kind: "semantic" as const,
    id: placement.id,
    tileX: placement.tileX,
    tileZ: placement.tileZ,
    rotation: placement.rotation,
  })),
);

export function buildSemanticBuildingsFromLayout(
  layout: readonly ClanPlacement[],
): readonly SemanticBuilding[] {
  return layout
    .filter((entry): entry is ClanPlacement & { kind: "semantic" } => entry.kind === "semantic")
    .map((placement) => ({
      id: placement.id,
      ...METADATA[placement.id],
      position: placementWorldPosition(placement),
    }));
}

export function getSemanticBuildingFromLayout(
  layout: readonly ClanPlacement[],
  id: SemanticBuildingId,
): SemanticBuilding {
  const building = buildSemanticBuildingsFromLayout(layout).find((entry) => entry.id === id);
  if (!building) throw new Error(`Unknown semantic building: ${id}`);
  return building;
}
