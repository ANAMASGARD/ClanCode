"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  DEFAULT_SEED_LAYOUT,
  type ClanPlacement,
} from "@/app/game/state/clan-layout";
import { mergeSavedLayout } from "@/app/game/state/layout-editor";

type ClanLayoutState = {
  layout: ClanPlacement[];
  savedLayout: ClanPlacement[];
  editMode: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
  setEditMode: (value: boolean) => void;
  setDraft: (updater: ClanPlacement[] | ((prev: ClanPlacement[]) => ClanPlacement[])) => void;
  done: () => void;
};

function sameLayout(left: ClanPlacement[], right: ClanPlacement[]): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function putLayout(placements: ClanPlacement[]): Promise<ClanPlacement[]> {
  const response = await fetch("/api/clan/layout", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ placements }),
  });
  const payload = (await response.json()) as {
    placements?: ClanPlacement[];
    error?: string;
  };
  if (!response.ok) {
    throw new Error(payload.error ?? "Save failed");
  }
  return mergeSavedLayout(payload.placements ?? placements);
}

export function useClanLayout(): ClanLayoutState {
  const [savedLayout, setSavedLayout] = useState<ClanPlacement[]>(DEFAULT_SEED_LAYOUT);
  const [draft, setDraftState] = useState<ClanPlacement[]>(DEFAULT_SEED_LAYOUT);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const skipAutosave = useRef(true);
  const persistGeneration = useRef(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch("/api/clan/layout", { cache: "no-store" });
        if (!response.ok) {
          if (active) setLoading(false);
          return;
        }
        const payload = (await response.json()) as { placements?: ClanPlacement[] | null };
        const merged = mergeSavedLayout(payload.placements ?? null);
        if (active) {
          skipAutosave.current = true;
          setSavedLayout(merged);
          setDraftState(merged);
          setLoading(false);
        }
      } catch {
        if (active) {
          setError("Could not load saved layout");
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback(async (placements: ClanPlacement[]) => {
    const generation = ++persistGeneration.current;
    setSaving(true);
    setError(null);
    try {
      const merged = await putLayout(placements);
      if (generation !== persistGeneration.current) return;
      skipAutosave.current = true;
      setSavedLayout(merged);
      setDraftState(merged);
    } catch (cause) {
      if (generation !== persistGeneration.current) return;
      setError(cause instanceof Error ? cause.message : "Save failed");
    } finally {
      if (generation === persistGeneration.current) {
        setSaving(false);
      }
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (skipAutosave.current) {
      skipAutosave.current = false;
      return;
    }
    if (!editMode || sameLayout(draft, savedLayout)) return;

    const timer = window.setTimeout(() => {
      void persist(draft);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [draft, editMode, loading, persist, savedLayout]);

  const setDraft = useCallback(
    (updater: ClanPlacement[] | ((prev: ClanPlacement[]) => ClanPlacement[])) => {
      setDraftState((prev) => (typeof updater === "function" ? updater(prev) : updater));
    },
    [],
  );

  const done = useCallback(() => {
    if (!sameLayout(draft, savedLayout)) {
      void persist(draft);
    }
    setEditMode(false);
    setError(null);
  }, [draft, persist, savedLayout]);

  return {
    layout: editMode ? draft : savedLayout,
    savedLayout,
    editMode,
    loading,
    saving,
    error,
    setEditMode,
    setDraft,
    done,
  };
}
