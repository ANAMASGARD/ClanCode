#!/usr/bin/env bun
import { config } from "dotenv";

import { createRealtimeGateway } from "../app/lib/realtime/gateway";
import {
  findDeviceByTokenHash,
  hashToken,
  touchDeviceHeartbeat,
  touchDevicePresence,
} from "../app/lib/pairing/service";

config({ path: ".env.local" });

const port = Number(process.env.CLANCODE_REALTIME_PORT ?? "3001");

const gateway = createRealtimeGateway({
  hashToken,
  findDeviceByTokenHash,
  touchDeviceHeartbeat,
  touchDevicePresence,
});

gateway.httpServer.listen(port, () => {
  console.log(
    `ClanCode realtime gateway listening on http://localhost:${String(port)}`,
  );
});
