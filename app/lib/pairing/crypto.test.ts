import { describe, expect, test } from "bun:test";

import {
  decryptDeviceToken,
  encryptDeviceToken,
  generateDeliveryKey,
} from "./crypto";

describe("pairing crypto", () => {
  test("encrypts with unique IV per token", () => {
    process.env.PAIRING_DELIVERY_KEY = generateDeliveryKey();
    const first = encryptDeviceToken("token-a");
    const second = encryptDeviceToken("token-b");
    expect(first.iv).not.toBe(second.iv);
    expect(decryptDeviceToken(first)).toBe("token-a");
    expect(decryptDeviceToken(second)).toBe("token-b");
  });

  test("rejects invalid delivery key length", () => {
    process.env.PAIRING_DELIVERY_KEY = "too-short";
    expect(() => encryptDeviceToken("x")).toThrow(/32 bytes/);
  });
});
