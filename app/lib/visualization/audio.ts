"use client";

const MUTE_STORAGE_KEY = "clan-code-audio-muted";

function audioUrl(fileName: string): string {
  return `/audio/${encodeURIComponent(fileName)}`;
}

export const AUDIO_URLS = {
  theme: audioUrl("Clan Code - Main Theme.m4a"),
  click: audioUrl("click-003.mp3"),
} as const;

export type AudioPlaybackStatus =
  | "played"
  | "blocked"
  | "muted"
  | "unavailable";

export type AudioController = {
  playTheme: () => Promise<AudioPlaybackStatus>;
  stopTheme: () => void;
  playClick: () => Promise<AudioPlaybackStatus>;
  setMuted: (muted: boolean) => void;
  toggleMuted: () => boolean;
  isMuted: () => boolean;
  dispose: () => void;
};

function readMutePreference(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    return window.localStorage.getItem(MUTE_STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
}

function writeMutePreference(muted: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(MUTE_STORAGE_KEY, String(muted));
  } catch {
    // Storage is optional convenience; audio behavior still works without it.
  }
}

class BrowserAudioController implements AudioController {
  private muted = readMutePreference();
  private theme: HTMLAudioElement | null = null;
  private click: HTMLAudioElement | null = null;

  async playTheme(): Promise<AudioPlaybackStatus> {
    const theme = this.getTheme();
    if (!theme) {
      return "unavailable";
    }

    theme.muted = this.muted;
    return this.play(theme);
  }

  stopTheme(): void {
    this.theme?.pause();
  }

  async playClick(): Promise<AudioPlaybackStatus> {
    if (this.muted) {
      return "muted";
    }

    const click = this.getClick();
    if (!click) {
      return "unavailable";
    }

    click.currentTime = 0;
    return this.play(click);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.theme) {
      this.theme.muted = muted;
    }
    if (this.click) {
      this.click.muted = muted;
    }
    writeMutePreference(muted);

    if (!muted && this.theme?.paused) {
      void this.playTheme();
    }
  }

  toggleMuted(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  dispose(): void {
    this.theme?.pause();
    this.click?.pause();
    this.theme = null;
    this.click = null;
  }

  private getTheme(): HTMLAudioElement | null {
    if (typeof window === "undefined") {
      return null;
    }

    if (!this.theme) {
      this.theme = new window.Audio(AUDIO_URLS.theme);
      this.theme.loop = true;
      this.theme.preload = "auto";
    }

    return this.theme;
  }

  private getClick(): HTMLAudioElement | null {
    if (typeof window === "undefined") {
      return null;
    }

    if (!this.click) {
      this.click = new window.Audio(AUDIO_URLS.click);
      this.click.preload = "auto";
    }

    return this.click;
  }

  private async play(
    audio: HTMLAudioElement,
  ): Promise<AudioPlaybackStatus> {
    try {
      await audio.play();
      return "played";
    } catch {
      return "blocked";
    }
  }
}

export function createAudioController(): AudioController {
  return new BrowserAudioController();
}
