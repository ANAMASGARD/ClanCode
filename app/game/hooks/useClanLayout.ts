"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  DEFAULT_SEED_LAYOUT,
  getPlacementId,
  type ClanPlacement,
} from "@/app/game/state/clan-layout";
import {
  mergeSavedLayout,
  removePlacement,
  restorePlacement,
} from "@/app/game/state/layout-editor";

type ClanLayoutState = {
  layout: ClanPlacement[];
  savedLayout: ClanPlacement[];
  removedPlacements: ClanPlacement[];
  editMode: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
  setEditMode: (value: boolean) => void;
  setDraft: (updater: ClanPlacement[] | ((prev: ClanPlacement[]) => ClanPlacement[])) => void;
  done: () => void;
  removeAndSave: (placementId: string) => Promise<boolean>;
  removeFromDraft: (placementId: string) => boolean;
  restorePlacement: (placementId: string) => Promise<boolean>;
};

function sameLayout(left: ClanPlacement[], right: ClanPlacement[]): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function rememberRemoved(current: ClanPlacement[], placement: ClanPlacement): ClanPlacement[] {
  const id = getPlacementId(placement);
  return [...current.filter((entry) => getPlacementId(entry) !== id), placement];
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
  const [removedPlacements, setRemovedPlacements] = useState<ClanPlacement[]>([]);
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
      setDraftState((current) => (sameLayout(current, placements) ? merged : current));
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

  const done = useCallback(async () => {
    if (sameLayout(draft, savedLayout)) {
      setEditMode(false);
      setError(null);
      return;
    }

    const generation = ++persistGeneration.current;
    setSaving(true);
    setError(null);
    try {
      const merged = await putLayout(draft);
      if (generation !== persistGeneration.current) return;
      skipAutosave.current = true;
      setSavedLayout(merged);
      setDraftState(merged);
      setEditMode(false);
    } catch (cause) {
      if (generation !== persistGeneration.current) return;
      setError(cause instanceof Error ? cause.message : "Save failed");
    } finally {
      if (generation === persistGeneration.current) {
        setSaving(false);
      }
    }
  }, [draft, savedLayout]);

  const removeFromDraft = useCallback((placementId: string): boolean => {
    let removed: ClanPlacement | undefined;
    setDraftState((current) => {
      const target = current.find((placement) => getPlacementId(placement) === placementId);
      if (target === undefined) {
        return current;
      }
      const next = removePlacement(current, placementId);
      if (next === null) {
        return current;
      }
      removed = target;
      return next;
    });
    if (removed === undefined) {
      return false;
    }
    setRemovedPlacements((current) => rememberRemoved(current, removed as ClanPlacement));
    return true;
  }, []);

  const removeAndSave = useCallback(async (placementId: string): Promise<boolean> => {
    const target = savedLayout.find((placement) => getPlacementId(placement) === placementId);
    if (target === undefined) {
      return false;
    }
    const next = removePlacement(savedLayout, placementId);
    if (next === null) {
      return false;
    }
    const generation = ++persistGeneration.current;
    setSaving(true);
    setError(null);
    try {
      const merged = await putLayout(next);
      if (generation !== persistGeneration.current) {
        return false;
      }
      skipAutosave.current = true;
      setSavedLayout(merged);
      setDraftState(merged);
      setRemovedPlacements((current) => rememberRemoved(current, target));
      return true;
    } catch (cause) {
      if (generation !== persistGeneration.current) {
        return false;
      }
      setError(cause instanceof Error ? cause.message : "Save failed");
      return false;
    } finally {
      if (generation === persistGeneration.current) {
        setSaving(false);
      }
    }
  }, [savedLayout]);

  const restorePlacementAtSavedTile = useCallback(
    async (placementId: string): Promise<boolean> => {
      const stored = removedPlacements.find((placement) => getPlacementId(placement) === placementId);
      if (stored === undefined) {
        return false;
      }

      const applyRestore = (layout: ClanPlacement[]): ClanPlacement[] | null =>
        restorePlacement(layout, stored);

      if (editMode) {
        let restored = false;
        setDraftState((current) => {
          const next = applyRestore(current);
          if (next === null) {
            return current;
          }
          restored = true;
          return next;
        });
        if (!restored) {
          setError("That tile is occupied — clear the spot first.");
          return false;
        }
        setRemovedPlacements((current) =>
          current.filter((placement) => getPlacementId(placement) !== placementId),
        );
        setError(null);
        return true;
      }

      const next = applyRestore(savedLayout);
      if (next === null) {
        setError("That tile is occupied — clear the spot first.");
        return false;
      }

      const generation = ++persistGeneration.current;
      setSaving(true);
      setError(null);
      try {
        const merged = await putLayout(next);
        if (generation !== persistGeneration.current) {
          return false;
        }
        skipAutosave.current = true;
        setSavedLayout(merged);
        setDraftState(merged);
        setRemovedPlacements((current) =>
          current.filter((placement) => getPlacementId(placement) !== placementId),
        );
        return true;
      } catch (cause) {
        if (generation !== persistGeneration.current) {
          return false;
        }
        setError(cause instanceof Error ? cause.message : "Save failed");
        return false;
      } finally {
        if (generation === persistGeneration.current) {
          setSaving(false);
        }
      }
    },
    [editMode, removedPlacements, savedLayout],
  );

  return {
    layout: editMode ? draft : savedLayout,
    savedLayout,
    removedPlacements,
    editMode,
    loading,
    saving,
    error,
    setEditMode,
    setDraft,
    done,
    removeAndSave,
    removeFromDraft,
    restorePlacement: restorePlacementAtSavedTile,
  };
}
