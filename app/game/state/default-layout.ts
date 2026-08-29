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

export const DEFAULT_CLAN_LAYOUT = [
  { id: "town-hall", name: "Town Hall", purpose: "Repository root and clan command", status: "Ready", position: [0, 1.2, 0], movable: true },
  { id: "search-tower", name: "Search Tower", purpose: "Read, list, grep and glob", status: "Watching", position: [9, 0.9, -7], movable: true },
  { id: "builder-workshop", name: "Builder Workshop", purpose: "Create, write and patch", status: "Idle", position: [11, 0.9, 7], movable: true },
  { id: "validation-forge", name: "Validation Forge", purpose: "Tests, typecheck and build", status: "Banked", position: [2, 0.9, 11], movable: true },
  { id: "session-lodge", name: "Session Lodge", purpose: "Sessions, resume and handoff", status: "Quiet", position: [-8, 0.9, -7], movable: true },
  { id: "model-shrine", name: "Model Shrine", purpose: "Model selection and agent identity", status: "Attuned", position: [8, 0.9, 1], movable: true },
  { id: "approval-gate", name: "Approval Gate", purpose: "Human checkpoint for sensitive actions", status: "Closed", position: [-2, 0.9, 15], movable: true },
  { id: "test-camp", name: "Test Camp", purpose: "Temporary run and worktree activity", status: "Standing by", position: [13, 0.9, 13], movable: true },
  { id: "market", name: "Tool Market", purpose: "Available tools and capabilities", status: "Open", position: [-7, 0.9, 3], movable: true },
  { id: "windmill", name: "Windmill", purpose: "Background and idle work", status: "Turning", position: [-13, 0.9, -10], movable: true },
  { id: "watermill", name: "Event Watermill", purpose: "Structured event processing flow", status: "Flowing", position: [-15, 0.9, 5], movable: false },
  { id: "farm", name: "Backlog Farm", purpose: "Queued and planned work", status: "Growing", position: [11, 0.9, -14], movable: false },
] as const satisfies readonly SemanticBuilding[];

export function getSemanticBuilding(id: SemanticBuildingId): SemanticBuilding {
  const building = DEFAULT_CLAN_LAYOUT.find((entry) => entry.id === id);
  if (!building) throw new Error(`Unknown semantic building: ${id}`);
  return building;
}
