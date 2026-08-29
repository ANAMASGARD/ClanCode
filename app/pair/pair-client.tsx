"use client";

import { SignIn, useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { SiteHeader } from "@/app/components/site-header";
import { formatUserCodeForDisplay } from "@/app/lib/pairing/display";

type DecisionState = "idle" | "approving" | "denying" | "approved" | "denied" | "error";

export default function PairPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const rawCode = searchParams.get("code") ?? "";
  const userCode = rawCode.replace(/-/g, "").toUpperCase();
  const displayCode = formatUserCodeForDisplay(userCode);
  const [decision, setDecision] = useState<DecisionState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const decide = useCallback(
    async (action: "approve" | "deny") => {
      if (userCode.length === 0) {
        setErrorMessage("Missing pairing code.");
        setDecision("error");
        return;
      }
      setDecision(action === "approve" ? "approving" : "denying");
      setErrorMessage(null);
      const response = await fetch(`/api/pair/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userCode: displayCode }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setErrorMessage(payload.error ?? "Pairing request failed");
        setDecision("error");
        return;
      }
      setDecision(action === "approve" ? "approved" : "denied");
    },
    [displayCode, userCode.length],
  );

  useEffect(() => {
    if (isLoaded && isSignedIn && decision === "approved") {
      const timer = setTimeout(() => router.push("/dashboard"), 1500);
      return () => clearTimeout(timer);
    }
  }, [decision, isLoaded, isSignedIn, router]);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="text-xl font-semibold">Pair this device</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Approve the laptop running <code className="font-mono">clancode login</code>{" "}
            so it can connect to your ClanCode control plane.
          </p>
        </div>

        {userCode.length > 0 ? (
          <div className="rounded-xl border border-black/[.08] p-4 dark:border-white/[.145]">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Pairing code</p>
            <p className="mt-1 font-mono text-2xl tracking-widest">{displayCode}</p>
          </div>
        ) : (
          <p className="text-sm text-red-600">No pairing code in this link.</p>
        )}

        {!isLoaded ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : !isSignedIn ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-zinc-500">
              Sign in to approve or deny this device.
            </p>
            <SignIn
              routing="hash"
              forceRedirectUrl={`/pair?code=${encodeURIComponent(displayCode)}`}
              fallbackRedirectUrl={`/pair?code=${encodeURIComponent(displayCode)}`}
            />
          </div>
        ) : decision === "approved" ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
            Device approved. Return to your terminal and run{" "}
            <code className="font-mono">clancode connect</code>.
          </div>
        ) : decision === "denied" ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
            Pairing denied. The CLI will not receive a device token.
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              disabled={decision === "approving" || decision === "denying" || userCode.length === 0}
              onClick={() => void decide("approve")}
            >
              {decision === "approving" ? "Approving…" : "Approve this device"}
            </button>
            <button
              type="button"
              className="rounded-full border border-black/[.08] px-5 py-2.5 text-sm font-medium disabled:opacity-50 dark:border-white/[.145]"
              disabled={decision === "approving" || decision === "denying" || userCode.length === 0}
              onClick={() => void decide("deny")}
            >
              {decision === "denying" ? "Denying…" : "Deny"}
            </button>
          </div>
        )}

        {errorMessage !== null ? (
          <p className="text-sm text-red-600">{errorMessage}</p>
        ) : null}
      </main>
    </>
  );
}
