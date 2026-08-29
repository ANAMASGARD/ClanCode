import { describe, expect, test } from "bun:test";

import {
  generateUserCode,
  hashToken,
  normalizeUserCode,
  safeCompareHashes,
} from "./constants";

describe("pairing constants", () => {
  test("user codes are formatted and normalized", () => {
    const code = generateUserCode();
    expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(normalizeUserCode(code)).toHaveLength(8);
  });

  test("hash and compare are stable", () => {
    const token = "sample-token";
    const hash = hashToken(token);
    expect(hash).toHaveLength(64);
    expect(safeCompareHashes(hash, hashToken(token))).toBe(true);
    expect(safeCompareHashes(hash, hashToken("other"))).toBe(false);
  });
});
