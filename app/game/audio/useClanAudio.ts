"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createAudioController, type AudioController } from "@/app/lib/visualization/audio";

export function useClanAudio() {
  const [controller] = useState<AudioController>(() => createAudioController());
  const started = useRef(false);
  const [muted, setMuted] = useState(() => controller.isMuted());

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) controller.stopTheme();
      else if (started.current) void controller.playTheme();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      controller.dispose();
    };
  }, [controller]);

  const interact = useCallback(() => {
    if (!started.current) {
      started.current = true;
      void controller.playTheme();
    }
    void controller.playClick();
  }, [controller]);

  const toggleMuted = useCallback(() => {
    if (!started.current) {
      started.current = true;
      void controller.playTheme();
    }
    setMuted(controller.toggleMuted());
  }, [controller]);

  return { muted, interact, toggleMuted };
}
