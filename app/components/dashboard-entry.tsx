"use client";

import { SignIn, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";

const DASHBOARD_PATH = "/dashboard";

const buttonClassName =
  "rounded-full border border-black/[.08] px-5 py-3 text-sm font-medium transition-colors hover:bg-black/[.04] disabled:opacity-50 dark:border-white/[.145] dark:hover:bg-[#1a1a1a]";

export function DashboardEntry({
  initialAuthOpen = false,
}: {
  initialAuthOpen?: boolean;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [userOpenedAuth, setUserOpenedAuth] = useState(false);
  const [authDismissed, setAuthDismissed] = useState(false);
  const titleId = useId();

  const isAuthOpen =
    !authDismissed &&
    (userOpenedAuth || (initialAuthOpen && isLoaded && !isSignedIn));

  const closeAuth = useCallback(() => {
    setUserOpenedAuth(false);
    setAuthDismissed(true);
    if (window.location.hash) {
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}${window.location.search}`,
      );
    }
  }, []);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("auth") !== "1") {
      return;
    }

    window.history.replaceState({}, "", "/");
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !initialAuthOpen) {
      return;
    }

    router.replace(DASHBOARD_PATH);
  }, [initialAuthOpen, isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (!isAuthOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeAuth();
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeAuth, isAuthOpen]);

  function handleDashboardClick() {
    if (!isLoaded) {
      return;
    }

    if (isSignedIn) {
      router.push(DASHBOARD_PATH);
      return;
    }

    setAuthDismissed(false);
    setUserOpenedAuth(true);
  }

  return (
    <>
      <button
        type="button"
        className={buttonClassName}
        onClick={handleDashboardClick}
        disabled={!isLoaded}
      >
        Dashboard
      </button>

      {isAuthOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 cursor-pointer bg-white/10 backdrop-blur-3xl dark:bg-black/20"
            aria-label="Close sign in"
            onClick={closeAuth}
          />
          <div className="pointer-events-none relative z-10 flex min-h-full items-center justify-center p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="pointer-events-auto"
            >
              <h2 id={titleId} className="sr-only">
                Sign in or sign up
              </h2>
              <SignIn
                routing="hash"
                withSignUp
                forceRedirectUrl={DASHBOARD_PATH}
                fallbackRedirectUrl={DASHBOARD_PATH}
                signUpForceRedirectUrl={DASHBOARD_PATH}
                signUpFallbackRedirectUrl={DASHBOARD_PATH}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
