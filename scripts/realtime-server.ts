#!/usr/bin/env bun
import { config } from "dotenv";

import { createRealtimeGateway } from "../app/lib/realtime/gateway";
import {
  findDeviceByTokenHash,
  hashToken,
  touchDeviceHeartbeat,
  touchDevicePresence,
} from "../app/lib/pairing/service";
import { applyAcceptedTask, applyProjectedRunEvent } from "../app/lib/clan-run/service";

config({ path: ".env.local" });

const port = Number(process.env.CLANCODE_REALTIME_PORT ?? "3001");
const relaySecret = process.env.CLANCODE_REALTIME_RELAY_SECRET ?? "";
if (relaySecret.length === 0) {
  console.warn("CLANCODE_REALTIME_RELAY_SECRET is not set; /internal/command will reject requests.");
}

const gateway = createRealtimeGateway({
  hashToken,
  findDeviceByTokenHash,
  touchDeviceHeartbeat,
  touchDevicePresence,
  relaySecret,
  persistAcceptedTask: applyAcceptedTask,
  persistRunEvent: applyProjectedRunEvent,
});

gateway.httpServer.listen(port, "127.0.0.1", () => {
  console.log(
    `ClanCode realtime gateway listening on http://127.0.0.1:${String(port)}`,
  );
});
