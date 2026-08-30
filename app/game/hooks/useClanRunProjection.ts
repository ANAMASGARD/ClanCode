"use client";

import { useEffect, useRef, useState } from "react";

import {
  emptyClanRunView,
  isClanRunBusy,
  type ClanRunView,
} from "@/app/lib/clan-run/types";

const ACTIVE_MS = 800;
const IDLE_MS = 4500;
const HIDDEN_MS = 15_000;

function pollMs(view: ClanRunView, hidden: boolean): number {
  if (hidden) {
    return HIDDEN_MS;
  }
  if (isClanRunBusy(view) || view.deliveryStage === "ready") {
    return ACTIVE_MS;
  }
  return IDLE_MS;
}

const CLAN_RUN_REFRESH = "clan-run-refresh";

export function requestClanRunRefresh(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CLAN_RUN_REFRESH));
  }
}

export function useClanRunProjection(): ClanRunView {
  const [view, setView] = useState<ClanRunView>(emptyClanRunView);
  const viewRef = useRef(view);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let inFlight = false;
    let controller: AbortController | undefined;

    const load = async (): Promise<void> => {
      if (inFlight || cancelled) {
        return;
      }
      inFlight = true;
      controller?.abort();
      controller = new AbortController();
      try {
        const response = await fetch("/api/clan/run", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok || cancelled) {
          return;
        }
        const payload = (await response.json()) as ClanRunView;
        if (!cancelled && typeof payload.phase === "string") {
          setView(payload);
        }
      } catch {
        // Keep the last good snapshot.
      } finally {
        inFlight = false;
      }
    };

    const tick = async (): Promise<void> => {
      await load();
      if (cancelled) {
        return;
      }
      timer = setTimeout(() => {
        void tick();
      }, pollMs(viewRef.current, document.hidden));
    };

    void tick();
    const onRefresh = () => {
      void load();
    };
    const onVisibility = () => {
      if (!document.hidden) {
        void load();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener(CLAN_RUN_REFRESH, onRefresh);
    return () => {
      cancelled = true;
      controller?.abort();
      if (timer !== undefined) {
        clearTimeout(timer);
      }
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener(CLAN_RUN_REFRESH, onRefresh);
    };
  }, []);

  return view;
}