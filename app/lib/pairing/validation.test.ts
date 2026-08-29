import { describe, expect, test } from "bun:test";

import { generateDeviceCode, generateUserCode } from "./constants";
import {
  isValidDeviceCode,
  isValidDeviceId,
  isValidUserCode,
} from "./validation";

describe("pairing validation", () => {
  test("accepts generated user codes", () => {
    expect(isValidUserCode(generateUserCode())).toBe(true);
    expect(isValidUserCode("IIII-OOOO")).toBe(false);
  });

  test("accepts generated device codes", () => {
    expect(isValidDeviceCode(generateDeviceCode())).toBe(true);
    expect(isValidDeviceCode("not-a-real-device-code")).toBe(false);
  });

  test("accepts uuid device ids", () => {
    expect(isValidDeviceId("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    expect(isValidDeviceId("device-test-1")).toBe(false);
  });
});
