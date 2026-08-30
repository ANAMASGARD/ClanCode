"use client";

import { useEffect, useState } from "react";

import { DEVICE_HEARTBEAT_TTL_MS } from "@/app/lib/pairing/constants";

const SLOW_POLL_MS = 10_000;
const FAST_POLL_MS = 1_000;

type DevicePresence = {
  online: boolean | null;
  checking: boolean;
};

type DevicesPayload = {
  devices?: Array<{ online: boolean; status: string; lastSeenAt: string | null }>;
};

/** Shared laptop presence from `/api/devices`. Poll faster while chat is open. */
export function useDevicePresence(fastPoll = false): DevicePresence {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const refresh = async (): Promise<void> => {
      try {
        const response = await fetch("/api/devices", { cache: "no-store" });
        if (!active) {
          return;
        }
        if (!response.ok) {
          setOnline(false);
          return;
        }
        const payload = (await response.json()) as DevicesPayload;
        const anyOnline = Boolean(payload.devices?.some((device) => device.online));
        setOnline(anyOnline);
      } catch {
        if (active) {
          setOnline(false);
        }
      }
    };

    const schedule = (): void => {
      void refresh().finally(() => {
        if (!active) {
          return;
        }
        timer = setTimeout(schedule, fastPoll ? FAST_POLL_MS : SLOW_POLL_MS);
      });
    };

    void schedule();
    return () => {
      active = false;
      if (timer !== undefined) {
        clearTimeout(timer);
      }
    };
  }, [fastPoll]);

  return { online, checking: online === null };
}

export { DEVICE_HEARTBEAT_TTL_MS, FAST_POLL_MS, SLOW_POLL_MS };
