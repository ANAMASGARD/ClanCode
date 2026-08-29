import { afterEach, describe, expect, test } from "bun:test";
import { config } from "dotenv";

import {
  approvePairingChallenge,
  denyPairingChallenge,
  pollPairingChallenge,
  startPairingChallenge,
} from "./service";

config({ path: ".env.local" });

const hasDatabase = process.env.DATABASE_URL !== undefined &&
  process.env.DATABASE_URL.length > 0;
const hasDeliveryKey = process.env.PAIRING_DELIVERY_KEY !== undefined &&
  process.env.PAIRING_DELIVERY_KEY.length > 0;

describe.skipIf(!hasDatabase || !hasDeliveryKey)("pairing service integration", () => {
  afterEach(() => {
    // Integration tests leave rows; acceptable for dev DB during CI if isolated.
  });

  test("denied challenge cannot be consumed", async () => {
    const start = await startPairingChallenge({
      hostname: "test-host",
      platform: "linux",
    });
    const denied = await denyPairingChallenge({
      userCode: start.userCode,
      clerkUserId: "user_test_denied",
    });
    expect(denied.ok).toBe(true);

    const poll = await pollPairingChallenge({ deviceCode: start.deviceCode });
    expect(poll.status).toBe("denied");
  });

  test("approved challenge delivers token once", async () => {
    const start = await startPairingChallenge({
      hostname: "test-host-2",
      platform: "linux",
    });
    const approved = await approvePairingChallenge({
      userCode: start.userCode,
      clerkUserId: "user_test_approved",
      label: "Integration Laptop",
    });
    expect(approved.ok).toBe(true);

    const first = await pollPairingChallenge({ deviceCode: start.deviceCode });
    expect(first.status).toBe("approved");
    if (first.status !== "approved") {
      return;
    }
    expect(first.token.length).toBeGreaterThan(20);

    const second = await pollPairingChallenge({ deviceCode: start.deviceCode });
    expect(second.status).toBe("expired");
  });
});
