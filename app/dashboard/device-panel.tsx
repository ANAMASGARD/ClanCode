"use client";

import { useCallback, useEffect, useState } from "react";

type DeviceRow = {
  id: string;
  label: string;
  platform: string | null;
  status: "pending" | "active" | "revoked";
  online: boolean;
  lastSeenAt: string | null;
  createdAt: string;
};

export function DevicePanel() {
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/devices", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Could not load devices");
      }
      const payload = (await response.json()) as { devices?: DeviceRow[] };
      setDevices(payload.devices ?? []);
      setError(null);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error ? fetchError.message : "Could not load devices",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initial = queueMicrotask(() => {
      void refresh();
    });
    void initial;
    const timer = setInterval(() => {
      void refresh();
    }, 5000);
    return () => clearInterval(timer);
  }, [refresh]);

  async function revokeDevice(id: string) {
    setRevokingId(id);
    try {
      const response = await fetch(`/api/devices/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Revoke failed");
      }
      await refresh();
    } catch (revokeError) {
      setError(
        revokeError instanceof Error ? revokeError.message : "Revoke failed",
      );
    } finally {
      setRevokingId(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading devices…</p>;
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Devices</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Pair your laptop with <code className="font-mono">clancode login</code>, then keep it
          online with <code className="font-mono">clancode connect</code>.
        </p>
      </div>

      {error !== null ? <p className="text-sm text-red-600">{error}</p> : null}

      {devices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/[.12] p-6 text-sm text-zinc-500 dark:border-white/[.18]">
          No devices yet. Run <code className="font-mono">clancode login</code> in your terminal.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {devices.map((device) => (
            <li
              key={device.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-black/[.08] p-4 dark:border-white/[.145]"
            >
              <div>
                <p className="font-medium">{device.label}</p>
                <p className="text-xs text-zinc-500">
                  {device.platform ?? "unknown platform"} · {device.status}
                  {device.online ? " · online" : " · offline"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={
                    device.online
                      ? "inline-flex items-center gap-1 text-sm text-emerald-600"
                      : "inline-flex items-center gap-1 text-sm text-zinc-500"
                  }
                >
                  <span
                    className={
                      device.online
                        ? "h-2 w-2 rounded-full bg-emerald-500"
                        : "h-2 w-2 rounded-full bg-zinc-400"
                    }
                  />
                  {device.online ? "Online" : "Offline"}
                </span>
                {device.status !== "revoked" ? (
                  <button
                    type="button"
                    className="rounded-full border border-black/[.08] px-3 py-1.5 text-xs font-medium disabled:opacity-50 dark:border-white/[.145]"
                    disabled={revokingId === device.id}
                    onClick={() => void revokeDevice(device.id)}
                  >
                    {revokingId === device.id ? "Revoking…" : "Revoke"}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
