"use client";

import { Show, SignIn, SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

const DASHBOARD_PATH = "/dashboard";

type LandingHeroProps = {
  initialAuthOpen?: boolean;
};

export function LandingHero({ initialAuthOpen = false }: LandingHeroProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [userOpenedAuth, setUserOpenedAuth] = useState(false);
  const [authDismissed, setAuthDismissed] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
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

  useEffect(() => {
    const video = videoRef.current;
    if (video === null) {
      return;
    }
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      video.pause();
      return;
    }
    void video.play().catch(() => {
      /* autoplay blocked — poster/overlay still readable */
    });
  }, []);

  const enableAudio = useCallback(() => {
    const video = videoRef.current;
    if (video === null || audioEnabled) {
      return;
    }
    video.muted = false;
    void video.play().then(() => {
      setAudioEnabled(true);
    }).catch(() => {
      /* keep muted if browser blocks */
    });
  }, [audioEnabled]);

  function handleHeroSurfaceClick() {
    if (!audioEnabled) {
      enableAudio();
    }
  }

  function handleBeginJourney() {
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
    <section
      className="landing-hero"
      aria-label="Clan Code introduction"
      onClick={handleHeroSurfaceClick}
    >
      <video
        ref={videoRef}
        className="landing-hero-video"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden
      >
        <source src="/video/Clan-Code-Hero.mp4" type="video/mp4" />
      </video>

      <div className="landing-hero-overlay" aria-hidden />

      {!audioEnabled && !isAuthOpen ? (
        <p className="landing-audio-hint" aria-live="polite">
          Click anywhere for sound
        </p>
      ) : null}

      <header className="landing-hero-header">
        <div className="landing-brand">
          <span className="landing-brand-mark" aria-hidden>
            ⚔
          </span>
          <span className="landing-brand-name">
            Clan Code<sup className="landing-brand-reg">®</sup>
          </span>
        </div>

        <nav className="landing-hero-nav" aria-label="Account">
          <Show when="signed-out">
            <SignInButton>
              <button type="button" className="landing-nav-btn">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton>
              <button type="button" className="landing-nav-btn landing-nav-btn-accent">
                Sign up
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <button
              type="button"
              className="landing-nav-btn landing-nav-btn-accent"
              onClick={() => router.push(DASHBOARD_PATH)}
            >
              Dashboard
            </button>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "landing-user-avatar",
                },
              }}
            />
          </Show>
        </nav>
      </header>

      <div className="landing-hero-top">
        <p className="landing-hero-eyebrow">Local-first AI coding harness</p>
        <h1 className="landing-hero-title">
          Build Your
          <br />
          Code Kingdom
        </h1>
      </div>

      <div className="landing-hero-spacer" aria-hidden />

      <div className="landing-hero-bottom">
        <p className="landing-hero-subtitle">
          Pair your laptop CLI, dispatch agents with human approvals, and watch real
          engineering state come alive on a living island — from planning and builds
          to validation and pull requests.
        </p>

        <ul className="landing-hero-features" aria-label="What Clan Code does">
          <li>TrueForge agents with explicit tool policy</li>
          <li>Castle command dock for plan &amp; build runs</li>
          <li>Approval gates before risky actions</li>
          <li>Git branches &amp; PRs from your machine</li>
        </ul>

        <button
          type="button"
          className="landing-cta"
          onClick={(event) => {
            event.stopPropagation();
            handleBeginJourney();
          }}
          disabled={!isLoaded}
        >
          <span className="landing-cta-icon" aria-hidden>
            ▷
          </span>
          {isSignedIn ? "Enter Dashboard" : "Begin Journey"}
        </button>
      </div>

      {isAuthOpen ? (
        <div className="landing-auth-layer">
          <button
            type="button"
            className="landing-auth-backdrop"
            aria-label="Close sign in"
            onClick={closeAuth}
          />
          <div className="landing-auth-dialog-wrap">
            <div role="dialog" aria-modal="true" aria-labelledby={titleId}>
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
    </section>
  );
}
