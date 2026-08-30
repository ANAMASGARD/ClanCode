import { describe, expect, test } from "bun:test";

import { DEFAULT_SEED_LAYOUT } from "@/app/game/state/clan-layout";
import { movePlacement, validateLayout } from "@/app/game/state/layout-editor";
import { isMissingClanLayoutsTable, parsePlacementsPayload } from "@/app/lib/clan-layout/service";

describe("clan layout service", () => {
  test("parses a valid layout payload", () => {
    const parsed = parsePlacementsPayload(DEFAULT_SEED_LAYOUT);
    expect(parsed).not.toBeNull();
    expect(parsed?.length).toBe(DEFAULT_SEED_LAYOUT.length);
  });

  test("rejects malformed payloads", () => {
    expect(parsePlacementsPayload(null)).toBeNull();
    expect(parsePlacementsPayload([{ kind: "prop", id: "x" }])).toBeNull();
  });

  test("validateLayout accepts default seed", () => {
    expect(validateLayout(DEFAULT_SEED_LAYOUT).valid).toBe(true);
  });

  test("movePlacement rejects fixed semantics", () => {
    const moved = movePlacement(DEFAULT_SEED_LAYOUT, "approval-gate", 3, 3);
    expect(moved).toBeNull();
  });

  test("detects a missing clan_layouts relation", () => {
    expect(isMissingClanLayoutsTable({ code: "42P01" })).toBe(true);
    expect(
      isMissingClanLayoutsTable({
        cause: { code: "42P01", message: 'relation "clan_layouts" does not exist' },
      }),
    ).toBe(true);
    expect(isMissingClanLayoutsTable(new Error("unrelated"))).toBe(false);
  });

  test("movePlacement allows session lodge relocation", () => {
    const moved = movePlacement(DEFAULT_SEED_LAYOUT, "session-lodge", 6, 6);
    expect(moved).not.toBeNull();
    const lodge = moved?.find((p) => p.kind === "semantic" && p.id === "session-lodge");
    expect(lodge?.tileX).toBe(6);
    expect(lodge?.tileZ).toBe(6);
  });
});
